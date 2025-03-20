# Medication Reminder System - MEDISYNC

## Description
A web application designed to help users manage their medication schedules efficiently. It features a clean UI with multiple tabs, medication tracking, and SMS notifications for reminders.

## Features
- Medication tracking with a dedicated progress section
- SMS notifications for medication reminders using Twilio
- Pharmacy locator - to locate nearby pharmacies having the required medicine
- Integrated mini game for cognitive development with dememtia 
## Installation
```sh
npm install twilio dotenv express cors node-cron mongoose axios mongodb
```

## Usage
1. Clone the repository
2. Run `npm install` to install dependencies
3. Add your environment variables in a `.env` file:
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=your_twilio_number
TO_NUMBER=your_target_number
```
4. Start the server with:
```sh
node server.js
```

## License
This project is licensed under the MIT License.
