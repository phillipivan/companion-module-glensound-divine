import { channelIds, channelLevelIds } from './choices.js'

/**
 * @import { CompanionStaticUpgradeScript } from '@companion-module/base'
 * @import { MigrationOptionValue, ModuleConfig, ModuleSecrets } from './types.js'
 */

/**
 * @typedef {object} ChannelOptionSpec
 * @property {string} optionId The option holding the channel selection
 * @property {string[]} validIds The choice ids the dropdown now accepts
 */

// The channel dropdowns used to be `allowCustom: true`, which was the only way for a user to
// drive them from a variable. Now that they are strict dropdowns, any stored value that isn't
// one of the defined choices can only have come from that custom-value path, so it has to be
// carried over to the field's expression mode instead.
/** @type {{ actions: Record<string, ChannelOptionSpec | undefined>, feedbacks: Record<string, ChannelOptionSpec | undefined> }} */
const channelOptionsToUpgrade = {
	actions: {
		mix_selection: { optionId: 'mix_selection', validIds: channelIds },
		mix_enable: { optionId: 'mix_enable', validIds: channelIds },
	},
	feedbacks: {
		Meter: { optionId: 'meterVal1', validIds: channelLevelIds },
	},
}

/**
 * Escape a string for embedding in a double quoted expression literal.
 * @param {string} str
 * @returns {string}
 */
function escapeForExpression(str) {
	return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Convert a channel option value that is no longer a valid dropdown choice into an expression.
 * @param {MigrationOptionValue | undefined} rawValue The stored option value
 * @param {string[]} validIds The choice ids the dropdown now accepts
 * @returns {MigrationOptionValue | null} the replacement value, or null if the stored value is fine as it is
 */
export function upgradeChannelOptionValue(rawValue, validIds) {
	// Nothing stored, or the user is already using an expression
	if (!rawValue || rawValue.isExpression) return null

	const value = rawValue.value

	// Already a valid selection
	if (typeof value === 'string' && validIds.includes(value)) return null

	// An unpadded number or string that still names a real channel can be repaired in place,
	// which keeps it as a normal dropdown selection rather than needlessly becoming an expression
	if (typeof value === 'number' || typeof value === 'string') {
		const padded = String(value).padStart(2, '0')
		if (validIds.includes(padded)) return { isExpression: false, value: padded }
	}

	// Not something we can interpret (null, boolean, object...), leave it well alone
	if (typeof value !== 'string') return null

	const trimmed = value.trim()

	// A single plain variable reference is already valid expression syntax
	if (trimmed.startsWith('$(') && trimmed.endsWith(')') && !trimmed.slice(2).includes('$(')) {
		return { isExpression: true, value: trimmed }
	}

	// Something more involved, so preserve the old variables-in-a-string behaviour
	if (trimmed.includes('$(')) {
		return { isExpression: true, value: `parseVariables("${escapeForExpression(value)}")` }
	}

	// No variable at all. It was still a custom value, so keep it verbatim as a string literal
	// rather than letting it silently fall back to the dropdown default
	return { isExpression: true, value: JSON.stringify(value) }
}

/**
 * Move custom channel values onto the expression form of the field, now that the channel
 * dropdowns no longer accept custom values.
 * @type {CompanionStaticUpgradeScript<ModuleConfig, ModuleSecrets>}
 */
function convertCustomChannelValuesToExpressions(_context, props) {
	const updatedActions = []
	const updatedFeedbacks = []

	for (const action of props.actions) {
		const spec = channelOptionsToUpgrade.actions[action.actionId]
		if (!spec) continue

		const replacement = upgradeChannelOptionValue(action.options[spec.optionId], spec.validIds)
		if (!replacement) continue

		action.options[spec.optionId] = replacement
		updatedActions.push(action)
	}

	for (const feedback of props.feedbacks) {
		const spec = channelOptionsToUpgrade.feedbacks[feedback.feedbackId]
		if (!spec) continue

		const replacement = upgradeChannelOptionValue(feedback.options[spec.optionId], spec.validIds)
		if (!replacement) continue

		feedback.options[spec.optionId] = replacement
		updatedFeedbacks.push(feedback)
	}

	return {
		updatedConfig: null,
		updatedActions,
		updatedFeedbacks,
	}
}

/** @type {CompanionStaticUpgradeScript<ModuleConfig, ModuleSecrets>[]} */
export const UpgradeScripts = [
	/*
	 * Remember that once an upgrade script has been added it cannot be removed!
	 */
	convertCustomChannelValuesToExpressions,
]
