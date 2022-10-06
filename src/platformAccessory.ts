import type { PlatformAccessory } from 'homebridge';
import { compact } from 'lodash';
import { ERD_TYPES } from './constants';
import { SmartHQPlatform } from './platform';
import type { SmartHqContext } from './platform';
import axios from 'axios';

export class SmartHQOven {
	constructor(
		private readonly platform: SmartHQPlatform,
		private readonly accessory: PlatformAccessory<SmartHqContext>,
	) {
		this.accessory
			.getService(this.platform.Service.AccessoryInformation)!
			.setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.brand)
			.setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model)
			.setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.serial)
			.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.nickname);

		compact(
			this.accessory.context.device.features.map(feature => {
				/* [
					'COOKING_V1_ACCENT_LIGHTING',
					'COOKING_V1_EXTENDED_COOKTOP_FOUNDATION',
					'COOKING_V1_MENU_TREE',
					'COOKING_V1_UPPER_OVEN_FOUNDATION',
					'COOKING_V2_CLOCK_DISPLAY',
					'COOKING_V2_UPPER_CAVITY_REMOTE_PRECISION_COOK',
				]; */

				switch (feature) {
					case 'COOKING_V1_UPPER_OVEN_FOUNDATION': {
						const ovenLight =
							this.accessory.getService('Upper Oven Light') ||
							this.accessory.addService(this.platform.Service.Lightbulb, 'Upper Oven Light', 'Oven');

						ovenLight
							.getCharacteristic(this.platform.Characteristic.On)
							.onGet(() =>
								axios
									.get(`/appliance/${accessory.context.device.applianceId}/erd/${ERD_TYPES.UPPER_OVEN_LIGHT}`)
									.then(r => parseInt(r.data.value) !== 0),
							)
							.onSet((value: boolean) =>
								axios
									.post(
										`/appliance/${accessory.context.device.applianceId}/erd/${ERD_TYPES.UPPER_OVEN_LIGHT}`,
										this.erdPayload(ERD_TYPES.UPPER_OVEN_LIGHT, value),
									)
									.then(() => undefined),
							);

						return ovenLight;
					}

					case 'COOKING_V1_ACCENT_LIGHTING': {
						const service =
							this.accessory.getService('Accent Light') ||
							this.accessory.addService(this.platform.Service.Lightbulb, 'Accent Light', 'Stove');
					}
				}
			}),
		);
	}

	erdPayload(erd: string, value: string | boolean) {
		return {
			kind: 'appliance#erdListEntry',
			userId: this.accessory.context.userId,
			applianceId: this.accessory.context.device.applianceId,
			erd,
			value: typeof value === 'boolean' ? (value ? '01' : '00') : value,
		};
	}
}
