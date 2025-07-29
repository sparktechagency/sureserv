import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSMS = async (to, message) => {
  try {
    const messageOptions = {
      body: message,
      to: to,
    };

    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    } else if (process.env.TWILIO_PHONE_NUMBER) {
      messageOptions.from = process.env.TWILIO_PHONE_NUMBER;
    } else {
      throw new Error('Neither TWILIO_MESSAGING_SERVICE_SID nor TWILIO_PHONE_NUMBER is configured.');
    }

    const twilioMessage = await client.messages.create(messageOptions);
    console.log(`SMS sent to ${to}: SID - ${twilioMessage.sid}, Status - ${twilioMessage.status}`);
  } catch (error) {
    console.error(`Error sending SMS to ${to}:`, error);
    throw new Error('Failed to send SMS.');
  }
};