import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { Cron } from '@nestjs/schedule';
import { MailgunService } from 'src/mailgun/mailgun.service';

@Injectable()
export class CronService {
  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    private readonly mailgunService: MailgunService,
  ) {}

  @Cron('0 0 * * *')
  async sendNudgeEmails() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usersToNudge = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.positions', 'position')
      .where('user.created_at <= :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('position.id IS NULL')
      .andWhere('user.isFirstExperienceMailSent = false')
      .getMany();

    for (const user of usersToNudge) {
      try {
        const messageData = {
          from: `TrackRec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
          to: user.email,
          subject: `Complete Your TrackRec Profile`,
          html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Complete Your TrackRec Profile</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333;
                line-height: 1.6;
              }
              .container {
                width: 80%;
                margin: auto;
                overflow: hidden;
              }
              .header, .footer {
                background: #333;
                color: #fff;
                padding: 20px 0;
                text-align: center;
              }
              .content {
                background: #fff;
                padding: 20px;
                margin: 20px 0;
              }
              .button {
                display: inline-block;
                background: #28a745;
                color: #fff;
                padding: 10px 15px;
                text-align: center;
                text-decoration: none;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Complete Your TrackRec Profile</h1>
              </div>
              <div class="content">
                <p>Hello ${user.full_name},</p>
                <p>You recently created a TrackRec but haven't updated any experiences.</p>
                <p>In order to match you with a job opportunity, we need to understand what you've achieved for the past 2 years at least.</p>
                <p>Go to <a href="https://app.trackrec.co/">https://app.trackrec.co/</a> so you can tell us more and also set your own terms for your next role (Title, Compensation, Location, Work environment etc).</p>
                <p>Any questions, just answer to this email!</p>
                <p>Let's grow your sales career,</p>
                <p>Victor @ TrackRec<br>Founder</p>
                <p><a href="https://app.trackrec.co/" class="button">Go to TrackRec</a></p>
              </div>
              <div class="footer">
                <p>Best,<br>
                  Team TrackRec<br> 
                  <a href="https://app.trackrec.co/" style="color: #fff;">app.trackrec.co</a>
                </p>
              </div>
            </div>
          </body>
          </html>`,
        };

        await this.mailgunService.sendMail(messageData);
        user.isFirstExperienceMailSent = true;
        await this.userRepository.save(user);
      } catch (error) {
        console.error(
          `Failed to send nudge email to user ${user.email}:`,
          error,
        );
      }
    }
  }
}
