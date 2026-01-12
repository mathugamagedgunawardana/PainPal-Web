import { google } from 'googleapis';

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export function getServiceAccountAuth() {
	const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

	if (!clientEmail || !privateKey) {
		throw new Error('Google Drive service account credentials are not configured');
	}

	return new google.auth.JWT({
		email: clientEmail,
		key: privateKey,
		scopes: DRIVE_SCOPES,
	});
}

export function getUserOAuthClient(refreshToken: string) {
	const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
	const redirectUri =
		process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

	if (!clientId || !clientSecret) {
		throw new Error('Google OAuth client credentials are not configured');
	}

	const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
	oauth2Client.setCredentials({ refresh_token: refreshToken });
	return oauth2Client;
}

