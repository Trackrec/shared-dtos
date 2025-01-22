import { Injectable } from '@nestjs/common';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import { configurations } from '../config/env.config';

const { mailgun: {key, domain} } = configurations;
@Injectable()
export class MailgunService {
  constructor() {}

  // mailgun secret key
  private MAILGUN_KEY = key;
  private MAILGUN_DOMAIN = domain;

  private client = new Mailgun(FormData).client({
    username: 'api',
    key: this.MAILGUN_KEY,
  });

  /**
   * Send via API
   *
   * @param data
   */
  async sendMail(data) {
    this.client.messages
      .create(this.MAILGUN_DOMAIN, data)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
