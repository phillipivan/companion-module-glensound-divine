import { combineRgb, createModuleLogger } from '@companion-module/base'
import { graphics } from 'companion-module-utils'
import { channelLevelChoices } from './choices.js'

const logger = createModuleLogger('Feedbacks')

/**
 * @import { CompanionFeedbackDefinitions, DropdownChoice, SomeCompanionFeedbackInputField } from '@companion-module/base'
 * @import { GraphicPosition, ModuleFeedbacks } from './types.js'
 * @import GS_Divine from './index.js'
 */

/** @type {DropdownChoice<string>[]} */
const indicators = [
	{ id: 'vol', label: 'Volume' },
	{ id: 'pot', label: 'Potentiometer' },
	{ id: 'temp', label: 'Temperature' },
]

/** @type {SomeCompanionFeedbackInputField<'position'>} */
const positionOption = {
	type: 'dropdown',
	label: 'Position',
	id: 'position',
	default: 'right',
	choices: [
		{ id: 'left', label: 'Left' },
		{ id: 'right', label: 'Right' },
		{ id: 'top', label: 'Top' },
		{ id: 'bottom', label: 'Bottom' },
	],
}

/** @type {SomeCompanionFeedbackInputField<'padding'>} */
const paddingOption = {
	type: 'number',
	label: 'Padding',
	id: 'padding',
	tooltip: 'Distance from edge of button',
	min: 0,
	max: 72,
	default: 1,
	asInteger: true,
}

/**
 * Declare the feedbacks this module offers.
 * @param {GS_Divine} self
 * @returns {void}
 */
export function updateFeedbacks(self) {
	/** @type {CompanionFeedbackDefinitions<ModuleFeedbacks>} */
	const feedbacks = {
		// Borrowed from Andrew Broughton's Yamaha RCP module
		Meter: {
			type: 'advanced',
			name: 'VUMeter',
			description: 'Show a Bargraph VU Meter on the button',
			affectedProperties: ['imageBuffer'],
			options: [
				positionOption,
				paddingOption,
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'meterVal1',
					default: channelLevelChoices[0].id,
					choices: channelLevelChoices,
					allowCustom: false,
					allowInvalidValues: true,
					tooltip: `Expressions must return a value between 01 and 08`,
				},
			],
			callback: (feedback, _context) => {
				if (feedback.image === undefined) {
					logger.debug('VUMeter feedback: control does not support an image buffer')
					return {}
				}
				const position = feedback.options.position
				const padding = feedback.options.padding
				let ofsX1 = 0
				let ofsY1 = 0
				let bWidth = 0
				let bLength = 0
				/**
				 * Map a dB level onto a 0-100 bar percentage.
				 * @param {number} mtrVal
				 * @returns {number}
				 */
				const bVal = (mtrVal) => {
					switch (true) {
						case mtrVal <= -30:
							return mtrVal + 62
						case mtrVal <= -18:
							return (mtrVal + 30) * 2 + 25
						case mtrVal <= 0:
							return (mtrVal + 18) * 2.5 + 54
						default:
							return 100 // mtrVal > 0
					}
				}
				switch (position) {
					case 'left':
						ofsX1 = padding
						ofsY1 = 5
						bWidth = 6
						bLength = feedback.image.height - ofsY1 * 2
						break
					case 'right':
						ofsY1 = 5
						bWidth = 6
						bLength = feedback.image.height - ofsY1 * 2
						ofsX1 = feedback.image.width - bWidth - padding
						break
					case 'top':
						ofsX1 = 5
						ofsY1 = padding
						bWidth = 7
						bLength = feedback.image.width - ofsX1 * 2
						break
					case 'bottom':
						ofsX1 = 5
						bWidth = 7
						bLength = feedback.image.width - ofsX1 * 2
						ofsY1 = feedback.image.height - bWidth - padding
				}
				const chan = String(feedback.options.meterVal1).padStart(2, '0')
				/** @type {graphics.OptionsBar} */
				const options1 = {
					width: feedback.image.width,
					height: feedback.image.height,
					colors: [
						{ size: 45, color: combineRgb(0, 255, 0), background: combineRgb(0, 255, 0), backgroundOpacity: 64 },
						{ size: 52, color: combineRgb(255, 165, 0), background: combineRgb(255, 165, 0), backgroundOpacity: 64 },
						{ size: 1, color: combineRgb(255, 0, 0), background: combineRgb(255, 0, 0), backgroundOpacity: 64 },
					],
					barLength: bLength,
					barWidth: bWidth,
					type: position == 'left' || position == 'right' ? 'vertical' : 'horizontal',
					value: bVal(self.levels.get(chan) ?? -100),
					offsetX: ofsX1,
					offsetY: ofsY1,
					opacity: 255,
				}
				/** @type {graphics.OptionsBar} */
				const peak1 = {
					...options1,
					colors: [
						{ size: 100, color: combineRgb(255, 0, 0), background: combineRgb(255, 0, 0), backgroundOpacity: 64 },
					],
					value: 100,
				}

				const buffer = options1.value == 100 ? graphics.bar(peak1) : graphics.bar(options1)
				return { imageBuffer: Buffer.from(buffer).toString('base64') }
			},
		},
		Indicator: {
			type: 'advanced',
			name: 'Indicator',
			description: 'Show a position indicator on the button',
			affectedProperties: ['imageBuffer'],
			options: [
				positionOption,
				paddingOption,
				{
					type: 'dropdown',
					label: 'Value',
					id: 'indicatorType',
					default: indicators[0].id,
					choices: indicators,
					allowCustom: false,
				},
				{
					type: 'colorpicker',
					label: 'Color',
					id: 'indicatorColor',
					default: 0xffffff,
					enableAlpha: false,
					returnType: 'number',
				},
			],
			callback: (feedback, _context) => {
				if (feedback.image === undefined) {
					logger.debug('Indicator feedback: control does not support an image buffer')
					return {}
				}
				const position = feedback.options.position
				const padding = feedback.options.padding
				let ofsX1 = 0
				let ofsY1 = 0
				let bLength = 0
				/**
				 * Normalise an indicator reading to 0-1.
				 * @param {number} indVal
				 * @param {number} [max]
				 * @param {number} [min]
				 * @returns {number}
				 */
				const iVal = (indVal, max = 127, min = 0) => {
					return (indVal - min) / (max - min)
				}
				/**
				 * Position the marker along the bar.
				 * @param {number} bLength
				 * @param {number} value Normalised 0-1 position
				 * @param {number} offset
				 * @returns {number}
				 */
				const markerOffset = (bLength, value, offset) => {
					return bLength * value + offset
				}
				switch (position) {
					case 'left':
						ofsX1 = padding
						ofsY1 = 4
						bLength = feedback.image.height - ofsY1 * 2 - 2
						break
					case 'right':
						ofsY1 = 4
						bLength = feedback.image.height - ofsY1 * 2 - 2
						ofsX1 = feedback.image.width - 6 - padding
						break
					case 'top':
						ofsX1 = 4
						ofsY1 = padding
						bLength = feedback.image.width - ofsX1 * 2 - 2
						break
					case 'bottom':
						ofsX1 = 4
						bLength = feedback.image.width - ofsX1 * 2 - 2
						ofsY1 = feedback.image.height - 7 - padding
				}
				const val = iVal(
					self.indicators.get(feedback.options.indicatorType) ?? 0,
					feedback.options.indicatorType == 'temp' ? 100 : 127,
				)
				/** @type {graphics.OptionsRect} */
				const options = {
					width: feedback.image.width,
					height: feedback.image.height,
					rectWidth: position == 'left' || position == 'right' ? 6 : 3,
					rectHeight: position == 'left' || position == 'right' ? 3 : 7,
					strokeWidth: 1,
					color: feedback.options.indicatorColor,
					fillColor: combineRgb(128, 128, 128),
					fillOpacity: 255,
					offsetX: position == 'left' || position == 'right' ? ofsX1 : markerOffset(bLength, val, ofsX1),
					offsetY:
						position == 'left' || position == 'right'
							? feedback.image.height - markerOffset(bLength, val, ofsY1)
							: ofsY1,
				}

				return { imageBuffer: Buffer.from(graphics.rect(options)).toString('base64') }
			},
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
