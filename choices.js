// Shared dropdown choices.
// The upgrade scripts validate stored values against these lists, so they must stay
// the single source of truth for what the channel dropdowns accept.

export const channelChoices = [
	{ id: '01', label: 'Channel 1' },
	{ id: '02', label: 'Channel 2' },
	{ id: '03', label: 'Channel 3' },
	{ id: '04', label: 'Channel 4' },
	{ id: '05', label: 'Channels 1-2' },
	{ id: '06', label: 'Channels 3-4' },
	{ id: '07', label: 'Channels 1-4' },
]

export const channelLevelChoices = [...channelChoices, { id: '08', label: 'Output' }]

export const channelIds = channelChoices.map((choice) => choice.id)
export const channelLevelIds = channelLevelChoices.map((choice) => choice.id)
