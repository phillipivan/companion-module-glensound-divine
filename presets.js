import { combineRgb } from '@companion-module/base'

/**
 * @import { CompanionPresetDefinitions, CompanionPresetSection } from '@companion-module/base'
 * @import { ModuleSchema } from './types.js'
 * @import GS_Divine from './index.js'
 */

/**
 * Declare the presets this module offers.
 * @param {GS_Divine} self
 * @returns {void}
 */
export function updatePresets(self) {
	/** @type {CompanionPresetSection<ModuleSchema>[]} */
	const structure = [
		{
			id: 'volume',
			name: 'Volume',
			definitions: ['VolumeKnob'],
		},
	]

	/** @type {CompanionPresetDefinitions<ModuleSchema>} */
	const presets = {}

	presets['VolumeKnob'] = {
		type: 'simple',
		name: 'Volume Knob',
		style: {
			text: 'Volume\\n$(device:volume_dB) dB',
			size: '14',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [],
				up: [],
				rotate_left: [
					{
						actionId: 'dec_volume',
						options: {
							step_down: 4,
						},
					},
				],
				rotate_right: [
					{
						actionId: 'inc_volume',
						options: {
							step_up: 4,
						},
					},
				],
			},
		],
		feedbacks: [
			{
				feedbackId: 'Meter',
				options: {
					position: 'bottom',
					padding: 1,
					meterVal1: '08',
				},
				headline: `Output Meter`,
			},
			{
				feedbackId: 'Indicator',
				options: {
					position: 'bottom',
					padding: 1,
					indicatorType: `vol`,
					indicatorColor: 0xffffff,
				},
				headline: `Output Volume`,
			},
		],
	}

	self.setPresetDefinitions(structure, presets)
}
