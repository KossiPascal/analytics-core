import { Component, Input } from '@angular/core';
import { ApiService } from '@kossi-services/api.service';
import { ModalService } from '@kossi-services/modal.service';

@Component({
    standalone: false,
    selector: 'app-sms',
    templateUrl: './sms.component.html',
    styleUrls: ['./sms.component.css']
})
export class SmsComponent {
    @Input() DATAS: string[] | { phone: string, message: string }[] = [];
    @Input() isCustomSms!: boolean;

    message:string = '';

    results: string[] = [];
    error: string | null = null;
    loading = false;

    constructor(private api: ApiService, public mService: ModalService) { }

    get recipientInput(): string {
        return (this.DATAS as string[]).join(', ');
    }

    get recipients(): string[] {
        return (this.DATAS as string[]).map(r => r.trim());
            // .filter(r => r.match(/^(\+224)?6\d{7}$/)); // Validate Guinea numbers
    }

    get customRecipients(): { phone: string, message: string }[] {
        return this.DATAS as { phone: string, message: string }[];
    }



    sendSms() {
        if (this.recipients.length === 0 || !this.message.trim()) {
            this.error = 'Vérifiez les numéros et le message.';
            return;
        }

        this.loading = true;
        this.error = null;

        const dataToSend = { phoneNumbers: this.recipients, message: this.message };

        this.api.sendSms(dataToSend).subscribe({
            next: (res: { status:number, data: any }) => {
                this.results = res.data;
                if (res.status == 200) {
                    this.mService.close({ success: true });
                } else {
                    this.error = res.data || 'Échec de l’envoi.';
                }
                this.loading = false;
            },
            error: (err) => {
                this.error = err.data || err.error?.error || 'Échec de l’envoi.';
                this.loading = false;
            }
        });
    }

    sendCustomSms() {
        if (this.customRecipients.length === 0) {
            this.error = 'Vérifiez les numéros et le message.';
            return;
        }

        this.loading = true;
        this.error = null;

        this.api.sendCustomSms(this.customRecipients).subscribe({
            next: (res: { status:number, data: any, errors:{ phone: string, message: string }[] }) => {
                this.results = res.data;
                if (res.status == 200) {
                    if (res.errors.length > 0) {
                        this.error = `Certains méssages n'ont pu etre envoyé.`;
                    } else {
                        this.mService.close({ success: true });
                    }
                } else {
                    this.error = res.data || 'Échec de l’envoi.';
                }
                this.loading = false;
                // { success: boolean, errorMsg ?: string }
            },
            error: (err) => {
                this.error = err.data || err.error?.error || 'Échec de l’envoi.';
                this.loading = false;
            }
        });
    }


    
}
