import { createModuleLogger } from '@companion-module/base'

/**
 * @import { CompanionActionDefinitions } from '@companion-module/base'
 * @import { ModuleActions } from './types.js'
 * @import GS_Divine from './index.js'
 */

const logger = createModuleLogger('Actions')

/**
 * Declare the actions this module offers.
 * @param {GS_Divine} self
 * @returns {void}
 */
export function updateActions(self) {
	/** @type {CompanionActionDefinitions<ModuleActions>} */
	
	const actions = {
		mix_selection: {
			name: 'Mix Selection',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'mix_selection',
					default: self.channels[0].id,
					choices: self.channels,
					allowCustom: false,
					allowInvalidValues: true,
					tooltip: `Expressions must return a value between 01 and 07`,
				},
			],
			callback: async ({ options }) => {
				const mixSel = String(options.mix_selection).padStart(2, '0')
				if (!self.channels.map((channel) => channel.id).includes(mixSel)) {
					logger.warn(`Invalid channel selection: ${mixSel}, value should be 01 - 07`)
					return
				}
				logger.debug('mix select: ' + mixSel)
				const cmd = '05' + mixSel + '0000'
				await self.sendMessage(cmd, '03')
			},
		},

		mix_enable: {
			name: 'Mix Enable',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'mix_enable',
					default: self.channels[0].id,
					choices: self.channels,
					allowCustom: false,
					allowInvalidValues: true,
					tooltip: `Expressions must return a value between 01 and 07`,
				},
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mix_enable_mode',
					default: '01',
					choices: [
						{ id: '01', label: 'Enable' },
						{ id: '00', label: 'Disable' },
					],
				},
			],
			callback: async ({ options }) => {
				const mixEnable = String(options.mix_enable).padStart(2, '0')
				if (!self.channels.map((channel) => channel.id).includes(mixEnable)) {
					logger.warn(`Invalid channel selection: ${mixEnable}, value should be 01 - 07`)
					return
				}
				logger.debug('mix enable: ' + mixEnable + ':' + options.mix_enable_mode)
				const cmd = '06' + mixEnable + options.mix_enable_mode + '00'
				await self.sendMessage(cmd, '03')
			},
		},

		set_volume: {
			name: 'Set Volume',
			options: [
				{
					type: 'number',
					label: 'Volume',
					id: 'volume',
					min: 0,
					max: 127,
					default: 50,
					range: true,
					step: 1,
					asInteger: true,
					clampValues: true,
					tooltip: 'Each step is 0.5dB',
				},
			],
			callback: async ({ options }) => {
				self.volume = Math.round(options.volume)
				logger.debug('vol: ' + self.volume)
				const cmd = '0E' + self.volume.toString(16).padStart(2, '0') + '0000'
				await self.sendMessage(cmd, '03')
			},
		},

		set_mute: {
			name: 'Mute',
			options: [],
			callback: async () => {
				if (self.volume != 0) {
					// avoids losing the previous value if mute pressed more than once
					self.unMute = self.volume
				}
				self.volume = 0
				logger.debug('mute: ' + self.volume)
				const cmd = '0E' + self.volume.toString(16).padStart(2, '0') + '0000'
				await self.sendMessage(cmd, '03')
			},
		},

		unset_mute: {
			name: 'Unmute',
			options: [],
			callback: async () => {
				self.volume = self.unMute
				logger.debug('unmute: ' + self.volume)
				const cmd = '0E' + self.volume.toString(16).padStart(2, '0') + '0000'
				await self.sendMessage(cmd, '03')
			},
		},

		inc_volume: {
			name: 'Volume Up',
			options: [
				{
					type: 'number',
					label: 'Step Size',
					id: 'step_up',
					min: 1,
					max: 24,
					default: 4,
					asInteger: true,
					clampValues: true,
					tooltip: 'Each step is 0.5dB',
				},
			],
			callback: async ({ options }) => {
				if (self.volume + options.step_up > 127) {
					self.volume = 127
				} else {
					self.volume += options.step_up
				}
				logger.debug('vol: ' + self.volume)
				const cmd = '0E' + self.volume.toString(16).padStart(2, '0') + '0000'
				await self.sendMessage(cmd, '03')
			},
		},

		dec_volume: {
			name: 'Volume Down',
			options: [
				{
					type: 'number',
					label: 'Step Size',
					id: 'step_down',
					min: 1,
					max: 24,
					default: 4,
					asInteger: true,
					clampValues: true,
					tooltip: 'Each step is 0.5dB',
				},
			],
			callback: async ({ options }) => {
				if (self.volume - options.step_down < 0) {
					self.volume = 0
				} else {
					self.volume -= options.step_down
				}
				logger.debug('vol: ' + self.volume)
				const cmd = '0E' + self.volume.toString(16).padStart(2, '0') + '0000'
				await self.sendMessage(cmd, '03')
			},
		},

		get_info: {
			name: 'Get Info',
			options: [],
			callback: async () => {
				logger.debug('get info')
				// get info has no command data
				await self.sendMessage(null, '05')
			},
		},
	}

	self.setActionDefinitions(actions)
}
