import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>(
        'MAILTRAP_HOST',
        'sandbox.smtp.mailtrap.io',
      ),
      port: this.configService.get<number>('MAILTRAP_PORT', 2525),
      auth: {
        user: this.configService.get<string>('MAILTRAP_USER', ''),
        pass: this.configService.get<string>('MAILTRAP_PASS', ''),
      },
    });
  }

  async sendOtp(to: string, otp: string) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'MAIL_FROM',
          'Multi Vendor Service <no-reply@multivendor.local>',
        ),
        to,
        subject: 'Your password reset OTP',
        text: `Your password reset OTP is ${otp}. It is valid for a limited time.`,
        html: `<p>Your password reset OTP is <b>${otp}</b>.</p><p>It is valid for a limited time.</p>`,
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to send OTP mail to ${to}, OTP is ${otp}`,
        error,
      );
    }
  }
}
