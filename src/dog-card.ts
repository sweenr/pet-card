/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  customElement,
  property,
  CSSResult,
  TemplateResult,
  css,
  PropertyValues,
  internalProperty,
} from 'lit-element';
import { HomeAssistant, hasConfigOrEntityChanged, LovelaceCardEditor, getLovelace } from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types

import './editor';

import type { DogCardConfig } from './types';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c DOG-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'dog-card',
  name: 'Dog Card',
  description: 'A custom card for showing dog info from Fi',
});

@customElement('dog-card')
export class DogCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('dog-card-editor');
  }

  public static getStubConfig(): object {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit-element.polymer-project.org/guide/properties
  @property({ attribute: false }) public hass!: HomeAssistant;
  @internalProperty() private config!: DogCardConfig;

  // https://lit-element.polymer-project.org/guide/properties#accessors-custom
  public setConfig(config: DogCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'Dog Card',
      ...config,
    };
  }

  // https://lit-element.polymer-project.org/guide/lifecycle#shouldupdate
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  // https://lit-element.polymer-project.org/guide/templates
  protected render(): TemplateResult | void {
    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this.config.show_warning) {
      return this._showWarning(localize('common.show_warning'));
    }

    if (this.config.show_error) {
      return this._showError(localize('common.show_error'));
    }

    const deviceTrackerEntityId = this.config.entity_device_tracker || '';
    const stepSensorEntityId = this.config.entity_steps || '';
    const lockSensorEntityId = this.config.entity_lost_dog || '';
    const lightEntityId = this.config.entity_light || '';

    const deviceTracker = this.hass.states[deviceTrackerEntityId];
    const stepsSensor = this.hass.states[stepSensorEntityId];
    const lostDogLock = this.hass.states[lockSensorEntityId];
    const collarLight = this.hass.states[lightEntityId];

    console.log(collarLight);

    const batteryPercent = parseInt(deviceTracker.attributes.battery_level);
    let batteryIcon = 'mdi:battery';
    if (batteryPercent < 100 && batteryPercent >= 50) {
      batteryIcon = 'mdi:battery-70';
    } else if (batteryPercent < 50 && batteryPercent >= 30) {
      batteryIcon = 'mdi:battery-50';
    } else {
      batteryIcon = 'mdi:battery-20';
    }

    return html`
      <ha-card tabindex="0" .label=${`Boilerplate: ${this.config.entity_device_tracker || 'No Entity Defined'}`}>
        <div class="card-content">
          <div class="header row">
            <img
              src=${deviceTracker.attributes.entity_picture}
              alt=${`picture of ${this.config.name || deviceTracker.attributes.friendly_name}`}
            />
            <h1>${this.config.name || deviceTracker.attributes.friendly_name}</h1>
          </div>
          <div class="battery row">
            <ha-icon .icon=${batteryIcon}></ha-icon>
            <p>Battery level: ${deviceTracker.attributes.battery_level}%</p>
          </div>
          ${stepSensorEntityId
            ? html` <div class="steps row">
                <ha-icon .icon=${stepsSensor.attributes.icon}></ha-icon>
                <p>${stepsSensor.state}/${this.config.step_goal} steps taken</p>
                <ha-gauge
                  .min=${0}
                  .max=${this.config.step_goal || 0}
                  .value=${parseInt(stepsSensor.state)}
                  .levels=${[
                    { level: 0, stroke: 'red' },
                    { level: (this.config.step_goal || 0) * 0.4, stroke: 'yellow' },
                    { level: (this.config.step_goal || 0) * 0.8, stroke: 'green' },
                  ]}
                >
                </ha-gauge>
              </div>`
            : ''}
          <div class="actions row">
            <ha-icon-button
              class="lost-dog-trigger"
              icon=${lostDogLock.attributes.icon || lostDogLock.state === 'locked' ? 'mdi:lock' : 'mdi:unlock'}
              label="Toggle Lost Dog"
              @click="${this._toggleLostDog}"
            >
            </ha-icon-button>
            <p>Toggle Lost Dog</p>
            <ha-icon-button
              class="light-trigger"
              icon=${collarLight.attributes.icon || 'mdi:lightbulb'}
              label="Toggle Collar Light"
              @click="${this._toggleLight}"
            >
            </ha-icon-button>
            <p>Toggle Collar Light</p>
          </div>
        </div>
      </ha-card>
    `;
  }

  // private _handleAction(ev: ActionHandlerEvent): void {
  //   if (this.hass && this.config && ev.detail.action) {
  //     handleAction(this, this.hass, this.config, ev.detail.action);
  //   }
  // }

  private _showWarning(warning: string): TemplateResult {
    return html` <hui-warning>${warning}</hui-warning> `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html` ${errorCard} `;
  }

  private _toggleLostDog(): void {
    const lostDogLock = this.hass.states[this.config.entity_lost_dog || ''];
    if (lostDogLock.state === 'locked') {
      this.hass.callService('lock', 'unlock', {
        // eslint-disable-next-line @typescript-eslint/camelcase
        entity_id: this.config.entity_lost_dog,
      });
    } else {
      this.hass.callService('lock', 'lock', {
        // eslint-disable-next-line @typescript-eslint/camelcase
        entity_id: this.config.entity_lost_dog,
      });
    }
  }

  private _toggleLight(): void {
    this.hass.callService('light', 'toggle', {
      // eslint-disable-next-line @typescript-eslint/camelcase
      entity_id: this.config.entity_light,
    });
  }

  // https://lit-element.polymer-project.org/guide/styles
  static get styles(): CSSResult {
    return css`
      .card-content {
        padding: 1rem;
      }
      img {
        width: 50px;
        height: 50px;
        border-radius: 100%;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      ha-icon {
        color: var(--paper-item-icon-color, var(--primary-text-color));
      }
      ha-icon-button {
        color: var(--paper-item-icon-color, var(--primary-text-color));
        transition: color 0.5s;
      }
      ha-icon-button[state-active] {
        color: var(--paper-item-icon-active-color, var(--primary-color));
      }
    `;
  }
}
