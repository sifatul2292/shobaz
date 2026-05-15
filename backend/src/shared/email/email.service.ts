import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}

  async sendEmail(email: string, subject: string, htmlBody: string) {
    try {
      const gmail = this.configService.get<string>('gmail');
      const appPassword = this.configService.get<string>('gmailAppPassword');

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmail,
          pass: appPassword,
        },
      });

      await transporter.sendMail({
        from: `"Shobaz" <${gmail}>`,
        replyTo: gmail,
        to: email,
        subject: subject,
        html: htmlBody,
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
