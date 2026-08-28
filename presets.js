import { combineRgb } from '@companion-module/base'

export function updatePresets() {
	const structure = [
		{
			id: 'volume',
			name: 'Volume',
			definitions: ['VolumeKnob'],
		},
	]

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

	this.setPresetDefinitions(structure, presets)
}
