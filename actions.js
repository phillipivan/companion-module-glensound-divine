export function updateActions() {
	let actions = {}

	actions['mix_selection'] = {
		name: 'Mix Selection',
		options: [
			{
				type: 'dropdown',
				label: 'Channel',
				id: 'mix_selection',
				default: this.channels[0].id,
				choices: this.channels,
				allowCustom: false,
				allowInvalidValues: true,
				tooltip: `Expressions must return a value between 01 and 07`,
			},
		],
		callback: async ({ options }) => {
			const mixSel = String(options.mix_selection).padStart(2, '0')
			if (!this.channels.map((channel) => channel.id).includes(mixSel)) {
				this.log('warn', `Invalid channel selection: ${mixSel}, value should be 01 - 07`)
				return
			}
			this.log('debug', 'mix select: ' + mixSel)
			const cmd = '05' + mixSel + '0000'
			await this.sendMessage(cmd, '03')
		},
	}

	actions['mix_enable'] = {
		name: 'Mix Enable',
		options: [
			{
				type: 'dropdown',
				label: 'Channel',
				id: 'mix_enable',
				default: this.channels[0].id,
				choices: this.channels,
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
			if (!this.channels.map((channel) => channel.id).includes(mixEnable)) {
				this.log('warn', `Invalid channel selection: ${mixEnable}, value should be 01 - 07`)
				return
			}
			this.log('debug', 'mix enable: ' + mixEnable + ':' + options.mix_enable_mode)
			const cmd = '06' + mixEnable + options.mix_enable_mode + '00'
			await this.sendMessage(cmd, '03')
		},
	}

	actions['set_volume'] = {
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
			this.volume = Math.round(options.volume)
			this.log('debug', 'vol: ' + this.volume)
			const cmd = '0E' + this.volume.toString(16).padStart(2, '0') + '0000'
			await this.sendMessage(cmd, '03')
		},
	}

	actions['set_mute'] = {
		name: 'Mute',
		options: [],
		callback: async () => {
			if (this.volume != 0) {
				// avoids losing the previous value if mute pressed more than once
				this.unMute = this.volume
			}
			this.volume = 0
			this.log('debug', 'mute: ' + this.volume)
			const cmd = '0E' + this.volume.toString(16).padStart(2, '0') + '0000'
			await this.sendMessage(cmd, '03')
		},
	}

	actions['unset_mute'] = {
		name: 'Unmute',
		options: [],
		callback: async () => {
			this.volume = this.unMute
			this.log('debug', 'unmute: ' + this.volume)
			const cmd = '0E' + this.volume.toString(16).padStart(2, '0') + '0000'
			await this.sendMessage(cmd, '03')
		},
	}

	actions['inc_volume'] = {
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
			if (this.volume + options.step_up > 127) {
				this.volume = 127
			} else {
				this.volume += options.step_up
			}
			this.log('debug', 'vol: ' + this.volume)
			const cmd = '0E' + this.volume.toString(16).padStart(2, '0') + '0000'
			await this.sendMessage(cmd, '03')
		},
	}

	actions['dec_volume'] = {
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
			if (this.volume - options.step_down < 0) {
				this.volume = 0
			} else {
				this.volume -= options.step_down
			}
			this.log('debug', 'vol: ' + this.volume)
			const cmd = '0E' + this.volume.toString(16).padStart(2, '0') + '0000'
			await this.sendMessage(cmd, '03')
		},
	}

	actions['get_info'] = {
		name: 'Get Info',
		options: [],
		callback: async () => {
			// get info has no command data
			await this.sendMessage(null, '05')
		},
	}

	this.setActionDefinitions(actions)
}
