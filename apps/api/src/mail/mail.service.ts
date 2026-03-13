import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly appName = 'HardGraph';
  private readonly smtpConfigured: boolean;

  constructor(private readonly config: ConfigService) {
    this.fromAddress = this.config.get<string>('SMTP_FROM', 'noreply@hardgraph.com');

    const smtpUser = this.config.get<string>('SMTP_USER', '');
    this.smtpConfigured = !!smtpUser;

    if (this.smtpConfigured) {
      const port = this.config.get<number>('SMTP_PORT', 587);
      const secure = this.config.get<string>('SMTP_SECURE', 'false') === 'true';

      this.logger.log(
        `SMTP config: host=${this.config.get('SMTP_HOST')}, port=${port}, secure=${secure}, user=${smtpUser}, from=${this.fromAddress}`,
      );

      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST', 'localhost'),
        port,
        secure,
        auth: {
          user: smtpUser,
          pass: this.config.get<string>('SMTP_PASS', ''),
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    } else {
      this.logger.warn(
        'SMTP_USER is not set — emails will be logged to console instead of sent. Set SMTP_* env vars for real delivery.',
      );
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.transporter) return;

    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified — ready to send emails');
    } catch (err) {
      this.logger.error(
        `SMTP connection FAILED: ${err instanceof Error ? err.message : 'unknown error'}. Emails will not be delivered!`,
      );
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    const verifyUrl = `${appUrl}/auth/verify?token=${encodeURIComponent(token)}`;

    // Dev fallback: log the link when SMTP is not configured
    if (!this.smtpConfigured) {
      this.logger.log(`
══════════════════════════════════════════════════════
  Verification email for ${to}
  ${verifyUrl}
══════════════════════════════════════════════════════`);
      return;
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #111; margin-bottom: 24px;">${this.appName}</h1>
        <p style="font-size: 16px; color: #333; margin-bottom: 8px;">Verify your email address</p>
        <p style="font-size: 14px; color: #666; margin-bottom: 24px;">
          Click the button below to verify your email and activate your account. This link expires in 24 hours.
        </p>
        <a href="${verifyUrl}" 
           style="display: inline-block; padding: 12px 32px; background-color: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Verify Email
        </a>
        <p style="font-size: 12px; color: #999; margin-top: 32px;">
          If you didn't create an account on ${this.appName}, you can safely ignore this email.
        </p>
        <p style="font-size: 12px; color: #999; margin-top: 8px;">
          Or copy this link: ${verifyUrl}
        </p>
      </div>
    `;

    try {
      const info = await this.transporter!.sendMail({
        from: this.fromAddress,
        to,
        subject: `Verify your email — ${this.appName}`,
        html,
      });
      this.logger.log(`Verification email sent to ${to} (messageId: ${info.messageId})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      this.logger.error(`Failed to send verification email to ${to}: ${message}`);
      throw new Error(`Email delivery failed: ${message}`);
    }
  }
}
