import { BasePanelUI } from './BasePanelUI';
import './donation-panel.css';

export class DonationPanel extends BasePanelUI {
  constructor(container: HTMLElement, map: mapboxgl.Map) {
    super(container, map);
  }

  public render(): void {
    const panel = document.createElement('div');
    panel.className = 'donation-panel';

    // Header
    const header = document.createElement('h2');
    header.className = 'donation-header';
    header.textContent = 'Support Glenn!';
    panel.appendChild(header);

    // Description
    const description = document.createElement('p');
    description.className = 'donation-description';
    description.textContent = 'To keep this project up and running (and to motivate me), feel free to give a small donation!';
    panel.appendChild(description);

    // Benefits
    const benefits = document.createElement('div');
    benefits.className = 'donation-benefits';
    benefits.innerHTML = `
      <h3>Donator Benefits:</h3>
      <ul>
        <li>🎭 "Donator" role in system</li>
        <li>✨ Custom icon next to your name in chat</li>
        <li>🚗 Special icon above your car</li>
      </ul>
    `;
    panel.appendChild(benefits);

    // Recent donations
    const recentDonations = document.createElement('div');
    recentDonations.className = 'recent-donations';
    recentDonations.innerHTML = `
      <h3>Recent Donations</h3>
      <p class="no-donations">Be the first to donate! 🎉</p>
    `;
    panel.appendChild(recentDonations);

    // Donation button
    const donateButton = document.createElement('a');
    donateButton.href = 'https://buymeacoffee.com/williamholmberg';
    donateButton.target = '_blank';
    donateButton.rel = 'noopener noreferrer';
    donateButton.className = 'donate-button';
    donateButton.textContent = '☕ Buy me a coffee';
    panel.appendChild(donateButton);

    this.container.appendChild(panel);
  }

  public destroy(): void {
    const panel = this.container.querySelector('.donation-panel');
    panel?.remove();
  }
} 