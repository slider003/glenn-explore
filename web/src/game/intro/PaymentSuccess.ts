export class PaymentSuccess {
    private container: HTMLElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'payment-success';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 90%;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Payment Successful!';
        title.style.cssText = `
            color: #32CD32;
            margin-bottom: 1rem;
        `;

        const message = document.createElement('p');
        message.textContent = 'Thank you for your payment. You now have full access to Glenn!';
        message.style.marginBottom = '1.5rem';

        const button = document.createElement('button');
        button.textContent = 'Continue to Game';
        button.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
        `;
        button.onclick = () => {
            window.location.href = '/';
        };

        this.container.appendChild(title);
        this.container.appendChild(message);
        this.container.appendChild(button);
    }

    public show(): void {
        document.body.appendChild(this.container);
    }

    public hide(): void {
        this.container.remove();
    }
} 