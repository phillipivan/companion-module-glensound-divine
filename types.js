// Type definitions for the module, expressed as JSDoc so the plain JavaScript
// sources can be checked with `yarn check-types`.
// This file contains no runtime code.

/**
 * @import { JsonValue } from '@companion-module/base'
 */

/**
 * The connection configuration, as produced by `getConfigFields()`.
 * @typedef {object} ModuleConfig
 * @property {string} host Device IP / hostname
 * @property {string} port Device port, held as a string by the textinput field
 * @property {string} controllerId Four hex bytes identifying this controller
 * @property {boolean} fastMeters Request fast metering updates from the device
 */

/**
 * This module stores nothing in the secrets store.
 * @typedef {undefined} ModuleSecrets
 */

/** @typedef {'left' | 'right' | 'top' | 'bottom'} GraphicPosition */

/** @typedef {'vol' | 'pot' | 'temp'} IndicatorType */

/**
 * A channel id chosen from a dropdown. These fields set `allowInvalidValues`, so an
 * expression may yield something outside the choice list and the callback normalises it.
 * @typedef {string | number} ChannelSelection
 */

/**
 * The variables this module exposes, and the type of value each one holds.
 * @typedef {object} ModuleVariables
 * @property {string} productId
 * @property {string} firmware
 * @property {string} hostName
 * @property {string} friendlyName
 * @property {string} domainName
 * @property {string | null} mixSelectLabel
 * @property {number} mixSelectValue
 * @property {number} volume
 * @property {number | string} volume_dB Decibel value, or the string `-INF` when muted
 * @property {number} levelInput1
 * @property {number} levelInput2
 * @property {number} levelInput3
 * @property {number} levelInput4
 * @property {number} levelInput12
 * @property {number} levelInput34
 * @property {number} levelInput1234
 * @property {number} levelOutput
 * @property {number} potPosition
 * @property {number} temp
 */

/**
 * The actions this module defines, and the options each one takes.
 * @typedef {object} ModuleActions
 * @property {{ options: { mix_selection: ChannelSelection } }} mix_selection
 * @property {{ options: { mix_enable: ChannelSelection, mix_enable_mode: string } }} mix_enable
 * @property {{ options: { volume: number } }} set_volume
 * @property {{ options: Record<string, never> }} set_mute
 * @property {{ options: Record<string, never> }} unset_mute
 * @property {{ options: { step_up: number } }} inc_volume
 * @property {{ options: { step_down: number } }} dec_volume
 * @property {{ options: Record<string, never> }} get_info
 */

/**
 * The feedbacks this module defines, and the options each one takes.
 * @typedef {object} ModuleFeedbacks
 * @property {{ type: 'advanced', options: MeterOptions }} Meter
 * @property {{ type: 'advanced', options: IndicatorOptions }} Indicator
 */

/**
 * @typedef {object} MeterOptions
 * @property {GraphicPosition} position
 * @property {number} padding
 * @property {ChannelSelection} meterVal1
 */

/**
 * @typedef {object} IndicatorOptions
 * @property {GraphicPosition} position
 * @property {number} padding
 * @property {IndicatorType} indicatorType
 * @property {number} indicatorColor
 */

/**
 * The full instance schema, supplied to `InstanceBase` so that actions, feedbacks,
 * variables and config are all checked against each other.
 * @typedef {object} ModuleSchema
 * @property {ModuleConfig} config
 * @property {ModuleSecrets} secrets
 * @property {ModuleActions} actions
 * @property {ModuleFeedbacks} feedbacks
 * @property {ModuleVariables} variables
 */

/**
 * An option value as seen by an upgrade script: either a literal value or an expression.
 * @typedef {import('@companion-module/base').ExpressionOrValue<JsonValue | undefined>} MigrationOptionValue
 */

export {}
