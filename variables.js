export function updateVariables() {
	this.setVariableDefinitions({
		productId: { name: 'Product ID' },
		firmware: { name: 'Firmware Version' },
		hostName: { name: 'Host Name' },
		friendlyName: { name: 'Friendly Name' },
		domainName: { name: 'Domain Name' },
		mixSelectLabel: { name: 'Mix Select Label' },
		mixSelectValue: { name: 'Mix Select Value' },
		volume: { name: 'Volume' },
		volume_dB: { name: 'Volume (dB)' },
		levelInput1: { name: 'Level: Input 1' },
		levelInput2: { name: 'Level: Input 2' },
		levelInput3: { name: 'Level: Input 3' },
		levelInput4: { name: 'Level: Input 4' },
		levelInput12: { name: 'Level: Input 1+2' },
		levelInput34: { name: 'Level: Input 3+4' },
		levelInput1234: { name: 'Level: Input 1+2+3+4' },
		levelOutput: { name: 'Level: Output' },
		potPosition: { name: 'Pot Position' },
		temp: { name: 'Device Temperature (C)' },
	})
}
