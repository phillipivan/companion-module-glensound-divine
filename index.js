// Glensound Divine

import { InstanceBase, InstanceStatus, Regex, UDPHelper } from '@companion-module/base'
import { updateActions } from './actions.js'
import { updateFeedbacks } from './feedback.js'
import { updatePresets } from './presets.js'
import { updateVariables } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { channelChoices } from './choices.js'
import PQueue from 'p-queue'
const queue = new PQueue({ concurrency: 1, interval: 5, intervalCap: 1 })
const MessageTimeOut = 10000

function readUint8AsTwosComplement(uint8Value) {
	const uint8Array = new Uint8Array([uint8Value])
	const int8Array = new Int8Array(uint8Array.buffer)
	return Number(int8Array[0])
}

export { UpgradeScripts }

export default class GS_Divine extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.updateActions = updateActions.bind(this)
		this.updateFeedbacks = updateFeedbacks.bind(this)
		this.updatePresets = updatePresets.bind(this)
		this.updateVariables = updateVariables.bind(this)
		this.status = InstanceStatus.Connecting
		this.updateStatus(this.status)
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module will allow you to control the Glensound Divine Network Audio Speaker.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Device IP / Hostname',
				width: 6,
				regex: Regex.HOSTNAME,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Device Port',
				width: 6,
				default: '41161',
				regex: Regex.PORT,
			},
			{
				type: 'static-text',
				id: 'controllerIdInfo',
				width: 6,
				label: 'Controller ID',
				value:
					'Each Glensound controller on the same network needs a unique ID. Unless you are running multiple controllers leave it at the Companion default (42495446). The ID must be 4 hex bytes.',
			},
			{
				type: 'textinput',
				id: 'controllerId',
				label: 'Controller ID',
				width: 6,
				default: '42495446',
				regex: '/^[abcdefABCDEF0123456789]{8}$/',
			},
			{
				type: 'checkbox',
				id: 'fastMeters',
				label: 'Fast Meters',
				width: 6,
				default: false,
			},
		]
	}

	async destroy() {
		queue.clear()
		if (this.timeout) clearTimeout(this.timeout)
		if (this.timer) {
			clearInterval(this.timer)
			delete this.timer
		}

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}
	}

	async init(config) {
		this.config = config
		this.volume = 0
		this.unMute = 0
		this.mixSelected = undefined
		this.timer = undefined
		this.channels = channelChoices
		this.levels = new Map()
		this.indicators = new Map()

		this.updateActions()
		this.updateVariables()
		this.updateFeedbacks()
		this.updatePresets()

		this.initUDP()
	}

	initUDP() {
		this.log('debug', `initUDP ${this.config.host}:${this.config.port}`)

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		if (this.config.host) {
			this.socket = new UDPHelper(this.config.host, Number(this.config.port))

			this.socket.on('status_change', (status, message) => {
				if (this.status == status) return
				this.updateStatus(status, message)
				this.status = status
				//if we are setting status to OK send a GetReport message to ensure module state is correct
				if (status == InstanceStatus.Ok) this.sendMessage('00000000', '0b').catch(() => {})
			})

			this.socket.on('error', (err) => {
				this.log('error', 'Network error: ' + err.message)
			})

			this.socket.on('listening', async () => {
				this.log('info', 'Listening')
				// get info
				await this.sendMessage(null, '05')
				// poll every 5 seconds
				this.timer = setInterval(this.dataPoller.bind(this), 5000)
				this.startTimeOut()
			})

			this.socket.on('data', (chunk) => {
				this.log('debug', 'Data received')
				this.processDeviceData(chunk)
				this.startTimeOut()
				if (this.status == InstanceStatus.Ok) return
				this.status = InstanceStatus.Ok
				this.updateStatus(this.status)
				//if we are setting status to OK send a GetReport message to ensure module state is correct
				this.sendMessage('001000000000', '0b').catch(() => {})
			})
		}
	}

	processDeviceData(data) {
		this.log('debug', 'processDeviceData')

		// get info test data from specification
		// data = Buffer.from([0x47,0x53,0x20,0x43,0x74,0x72,0x6c,0x00,0x90,0x00,0x04,0x0c,0x00,0x91,0xe9,0x80,0x00,0x24,0x17,0xdf,0xef,0xfe,0x32,0x7b,0x31,0x00,0x00,0x01,0x02,0x00,0x00,0x00,0x00,0x1d,0xc1,0xff,0xfe,0x91,0xe9,0x80,0x44,0x49,0x56,0x2d,0x30,0x31,0x2d,0x39,0x31,0x65,0x39,0x38,0x30,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x44,0x69,0x76,0x69,0x6e,0x65,0x2d,0x4d,0x61,0x72,0x63,0x69,0x6e,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x02,0x10,0x00,0x00,0x00,0x00,0x00,0x00])

		// status
		// data = Array.from([0x47,0x53,0x20,0x43,0x74,0x72,0x6c,0x00,0x28,0x00,0x01,0x00,0x0c,0x91,0xe9,0x80,0x02,0x00,0x00,0x00,0x00,0x01,0x02,0x00,0x00,0x00,0x00,0x00,0xfe,0xfe,0xfe,0xfe,0xfe,0xfe,0xfe,0xfe,0x13,0x6c,0xfc,0x00])

		// full report
		// data = Array.from([0x47,0x53,0x20,0x43,0x74,0x72,0x6c,0x00,0x60,0x00,0x0a,0x00,0x78,0x91,0xe9,0x80,0x01,0x01,0x04,0x00,0x80,0xbb,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x02,0x02,0x03,0x00,0x02,0x30,0x31,0x02,0x30,0x32,0x02,0x30,0x33,0x02,0x30,0x34,0x03,0x00,0x00,0x00,0x04,0x2f,0x09,0x00,0x56,0x00,0x00,0x00,0x02,0x00,0x00,0x00,0x00,0x00,0x02,0x02,0x16,0x00,0x00,0x00,0x05,0x00,0x00,0x00,0x06,0x02,0x02,0x02,0x01,0x00,0x02,0x07,0x1e,0x01,0x33,0x00,0x00,0x00,0x00,0x00])

		// divine report
		// data = Array.from([71,83,32,67,116,114,108,0,56,0,10,0,248,0,0,0,4,51,9,0,22,0,0,0,2,0,0,0,0,0,5,7,40,0,0,0,0,0,0,0,6,2,2,0,0,1,7,7,254,0,50,0,0,0,0,0])

		if (data != undefined) {
			this.log('debug', `length: ${data.length} data: ${Buffer.from(data).toString('hex')}`)

			if (data.length == 144) {
				if (data[10] == 4) {
					// opcode 4 (info)
					this.log('debug', 'get info data recevied')

					// Firmware
					// var firmware = data[17].toString(16).padStart(2, '0') + data[16].toString(16).padStart(2, '0')
					const firmware = data[17] + ' ' + data[16]
					this.log('debug', 'firmware ' + firmware)
					let productId
					// Product Id
					if (data[24] == 49 && data[25] == 0) {
						productId = '49 (Divine)'
					} else {
						productId = 'Unknown'
					}
					this.log('debug', 'productId ' + productId)

					// Host Name
					let hostName = ''
					for (let j = 40; j < 72; j++) {
						// this.log('debug', j + ':' + data[j])
						if (data[j] != 0) {
							hostName = hostName + String.fromCharCode(data[j])
						}
					}
					this.log('debug', 'hostName ' + hostName)

					// Friendly Name
					let friendlyName = ''
					for (let j = 72; j < 104; j++) {
						// this.log('debug', j + ':' + data[j])
						if (data[j] != 0) {
							friendlyName = friendlyName + String.fromCharCode(data[j])
						}
					}
					this.log('debug', 'friendlyName ' + friendlyName)
					// Domain Name
					let domainName = ''
					for (let j = 104; j < 136; j++) {
						// this.log('debug', j + ':' + data[j])
						if (data[j] != 0) {
							domainName = domainName + String.fromCharCode(data[j])
						}
					}
					this.log('debug', 'domainName ' + domainName)
					this.setVariableValues({
						firmware: firmware,
						productId: productId,
						hostName: hostName,
						friendlyName: friendlyName,
						domainName: domainName,
					})
				}
			} else if (data.length == 40) {
				if (data[10] == 1) {
					// opcode 1 (status)
					let updateIndicators = false
					this.log('debug', 'status data recevied')
					const potPos = data[36]
					if (this.indicators.get('pot') !== potPos) {
						this.indicators.set('pot', potPos)
						updateIndicators = true
					}
					const deviceVolume = data[37]
					this.volume = deviceVolume
					if (this.indicators.get('vol') !== deviceVolume) {
						this.indicators.set('vol', deviceVolume)
						updateIndicators = true
					}
					const lvl1 = -0.5 * data[0x1c]
					this.levels.set('01', lvl1)
					const lvl2 = -0.5 * data[0x1d]
					this.levels.set('02', lvl2)
					const lvl3 = -0.5 * data[0x1e]
					this.levels.set('03', lvl3)
					const lvl4 = -0.5 * data[0x1f]
					this.levels.set('04', lvl4)
					const lvl12 = -0.5 * data[0x20]
					this.levels.set('05', lvl12)
					const lvl34 = -0.5 * data[0x21]
					this.levels.set('06', lvl34)
					const lvl1234 = -0.5 * data[0x22]
					this.levels.set('07', lvl1234)
					const lvlOut = -0.5 * data[0x23]
					this.levels.set('08', lvlOut)
					const temp = 0.5 * readUint8AsTwosComplement(data[38]) + 44
					if (this.indicators.get('temp') !== temp) {
						this.indicators.set('temp', temp)
						updateIndicators = true
					}
					this.volume = deviceVolume
					this.log(
						'debug',
						`Volume: ${deviceVolume}, Levels: ${lvl1}, ${lvl2}, ${lvl3}, ${lvl4}, ${lvl12}, ${lvl34}, ${lvl1234}, ${lvlOut}, Pot Position: ${potPos}, Temperature: ${temp}`,
					)

					const vol_dB = deviceVolume == 0 ? '-INF' : -63.5 + deviceVolume * 0.5

					this.setVariableValues({
						volume: deviceVolume,
						volume_dB: vol_dB,
						levelInput1: lvl1,
						levelInput2: lvl2,
						levelInput3: lvl3,
						levelInput4: lvl4,
						levelInput12: lvl12,
						levelInput34: lvl34,
						levelInput1234: lvl1234,
						levelOutput: lvlOut,
						potPosition: potPos,
						temp: temp,
					})
					if (updateIndicators) {
						this.checkFeedbacks('Meter', 'Indicator')
					} else {
						this.checkFeedbacks('Meter')
					}
				}
			} else if (data.length == 56) {
				if (data[10] == 10) {
					// opcode 10 (report)
					if (data[16] == 4) {
						// divine report (type 4)
						this.log('debug', 'divine report data recevied')
						let mixSelect = data[47]
						let mixSelectLabel = null
						for (let i = 0; i < this.channels.length; i++) {
							if (this.channels[i].id == mixSelect) {
								mixSelectLabel = this.channels[i].label
								break
							}
						}
						if (this.mixSelected !== mixSelect) {
							this.mixSelected = mixSelect
							this.log('debug', 'mix select: ' + mixSelect + ' label: ' + mixSelectLabel)
							this.setVariableValues({
								mixSelectValue: mixSelect,
								mixSelectLabel: mixSelect.toString().padStart(2, '0'),
							})
						}
					}
				}
			} else if (data.length == 96) {
				if (data[10] == 10) {
					// opcode 10 (report)
					this.log('debug', 'report data recevied')
					let mixSelect = data[87]
					let mixSelectLabel = null
					for (let i = 0; i < this.channels.length; i++) {
						if (this.channels[i].id == mixSelect) {
							mixSelectLabel = this.channels[i].label
							break
						}
					}
					this.log('debug', 'mix select: ' + mixSelect + ' label: ' + mixSelectLabel)
					this.setVariableValues({ mixSelectValue: mixSelect, mixSelectLabel: mixSelectLabel })
				}
			} else if (data.length == 132) {
				if (data[10] == 10) {
					this.log('debug', 'report data recevied')
					// Check report data includes report 4
					if (data[92] == 4) {
						let mixSelect = data[123]
						let mixSelectLabel = null
						for (let i = 0; i < this.channels.length; i++) {
							if (this.channels[i].id == mixSelect) {
								mixSelectLabel = this.channels[i].label
								break
							}
						}
						this.log('debug', 'mix select: ' + mixSelect + ' label: ' + mixSelectLabel)
						this.setVariableValues({ mixSelectValue: mixSelect, mixSelectLabel: mixSelectLabel })
					}
				}
			} else if (data.length == 24) {
				if (data[10] == 6) {
					this.log('debug', 'Config data recevied')
					this.log(
						'info',
						`Sequence #: ${data[12]}, Device ID: ${data[13].toString(16) + data[14].toString(16) + data[15].toString(16)}\nStatus IP (if in shared mode): ${data[16]}.${data[17]}.${data[18]}.${data[19]} Port (if in shared mode): ${data[20] * 256 + data[21]}\nExclusive: ${Boolean(data[11] & 1)}, Password Valid: ${Boolean(data[11] & 4)}, Access Granted: ${Boolean(data[11] & 8)}`,
					)
				}
			}
		} else {
			this.log('warn', 'no data to process!')
		}
	}

	async configUpdated(config) {
		queue.clear()
		let resetConnection = false

		if (this.config.host != config.host || this.config.port != config.port) {
			resetConnection = true
		}

		this.config = config
		this.levels.clear()
		this.indicators.clear()
		this.mixSelected = undefined
		this.updateActions()
		this.updateVariables()
		this.updateFeedbacks()
		this.updatePresets()

		if (resetConnection === true || this.socket === undefined) {
			this.initUDP()
		}

		// get info
		this.sendMessage(null, '05')
	}

	async sendMessage(cmd, opcode) {
		if (this.config.controllerId.length != 8) {
			this.log('warn', 'Invalid Controller Id! Please check module settings.')
			return
		}

		this.log('debug', 'send opcode: ' + opcode + ' cmd: ' + cmd)

		const gsHeader = '4753204374726C00' // GS Ctrl
		const multipacket = '00'
		let flags, length, message
		if (opcode == '03') {
			// set control
			flags = this.config.fastMeters ? '01' : '03'
			// exclusive = true, meters = false
			length = (16 + cmd.length / 2).toString(16).padStart(2, '0')
			message = gsHeader + length + multipacket + opcode + flags + this.config.controllerId + cmd
			this.log('debug', 'Send control: ' + message)
		} else if (opcode == '05') {
			// get info
			flags = '00'
			length = '10'
			message = gsHeader + length + multipacket + opcode + flags + this.config.controllerId
			this.log('debug', 'Send getinfo: ' + message)
		} else if (opcode == '07') {
			// get config
			flags = this.config.fastMeters ? '01' : '03'
			length = '10'
			message = gsHeader + length + multipacket + opcode + flags + this.config.controllerId
			this.log('debug', 'Send getconfig: ' + message)
		} else if (opcode == '0b' || opcode == '0B') {
			// get report
			flags = this.config.fastMeters ? '01' : '03'
			length = '14'
			message = gsHeader + length + multipacket + opcode + flags + this.config.controllerId + cmd
			this.log('debug', 'Send getreport: ' + message)
		}

		if (message !== undefined) {
			await queue.add(async () => {
				if (this.socket !== undefined && !this.socket.isDestroyed) {
					try {
						await this.socket.sendAsync(this.hexStringToBuffer(message))
					} catch (error) {
						this.log('warn', `Message send failed!\nMessage: ${message}\nError: ${error?.message ?? String(error)}`)
					}
				} else {
					this.log('warn', 'Socket not connected')
				}
			})
		}
	}

	startTimeOut(timeout = MessageTimeOut) {
		if (this.timeout) clearTimeout(this.timeout)
		this.timeout = setTimeout(() => {
			if (this.status == InstanceStatus.ConnectionFailure) return
			this.status = InstanceStatus.ConnectionFailure
			this.updateStatus(this.status, `No data for ${timeout / 1000} seconds`)
		}, timeout)
	}

	padLeft(nr, n, str) {
		return Array(n - String(nr).length + 1).join(str || '0') + nr
	}

	asciiToHex(str) {
		const arr1 = []
		for (let n = 0, l = str.length; n < l; n++) {
			const hex = Number(str.charCodeAt(n)).toString(16)
			arr1.push(hex)
		}
		return arr1.join('')
	}

	hexStringToBuffer(str) {
		// this.log('debug', 'to buffer > ' + str)
		return Buffer.from(str, 'hex')
	}

	async dataPoller() {
		if (this.socket !== undefined && !this.socket.isDestroyed) {
			// send getConfig poll request
			await this.sendMessage(null, '07')
		} else {
			this.log('debug', 'dataPoller - Socket not open')
		}
	}
}
