import { Readable } from 'stream';
import { google, drive_v3 } from 'googleapis';
import { getServiceAccountAuth, getUserOAuthClient } from './auth/googleAuth';

export type DriveUploadType = 'thumbnail' | 'video' | 'document';

type DriveUploadResult = {
	id: string;
	name: string;
	mimeType?: string | null;
	size?: number;
	webViewLink?: string | null;
	webContentLink?: string | null;
	publicUrl: string;
};

let driveClient: drive_v3.Drive | null = null;

function getDriveClient() {
	if (!driveClient) {
		const auth = getServiceAccountAuth();
		driveClient = google.drive({ version: 'v3', auth });
	}
	return driveClient;
}

function getUserDriveClient(refreshToken: string) {
	const auth = getUserOAuthClient(refreshToken);
	return google.drive({ version: 'v3', auth });
}

function getFolderIdForType(type: DriveUploadType): string | undefined {
	switch (type) {
		case 'thumbnail':
			return process.env.GOOGLE_DRIVE_THUMBNAILS_FOLDER_ID;
		case 'video':
			return process.env.GOOGLE_DRIVE_VIDEOS_FOLDER_ID;
		case 'document':
			return process.env.GOOGLE_DRIVE_DOCUMENTS_FOLDER_ID;
		default:
			return undefined;
	}
}
    
export async function uploadToDrive(params: {
	buffer: Buffer;
	mimeType: string;
	filename: string;
	type: DriveUploadType;
}): Promise<DriveUploadResult> {
	const { buffer, mimeType, filename, type } = params;
	const drive = getDriveClient();

	const folderId = getFolderIdForType(type);

	const fileMetadata: drive_v3.Schema$File = {
		name: filename,
		parents: folderId ? [folderId] : undefined,
	};

	const media = {
		mimeType,
		body: Readable.from(buffer),
	};

	const { data } = await drive.files.create({
		requestBody: fileMetadata,
		media,
		fields: 'id, name, mimeType, size, webViewLink, webContentLink',
	});

	if (!data.id || !data.name) {
		throw new Error('Failed to upload file to Google Drive');
	}

	// Make file readable by anyone with the link
	await drive.permissions.create({
		fileId: data.id,
		requestBody: {
			role: 'reader',
			type: 'anyone',
		},
	});

	const publicUrl =
		data.webViewLink || `https://drive.google.com/file/d/${data.id}/view?usp=sharing`;

	return {
		id: data.id,
		name: data.name,
		mimeType: data.mimeType ?? undefined,
		size: data.size ? Number(data.size) : undefined,
		webViewLink: data.webViewLink,
		webContentLink: data.webContentLink,
		publicUrl,
	};
}

export async function uploadToUserDrive(params: {
	buffer: Buffer;
	mimeType: string;
	filename: string;
	type: DriveUploadType;
	refreshToken: string;
}): Promise<DriveUploadResult> {
	const { buffer, mimeType, filename, type, refreshToken } = params;
	const drive = getUserDriveClient(refreshToken);

	const folderId = getFolderIdForType(type);

	const fileMetadata: drive_v3.Schema$File = {
		name: filename,
		parents: folderId ? [folderId] : undefined,
	};

	const media = {
		mimeType,
		body: Readable.from(buffer),
	};

	const { data } = await drive.files.create({
		requestBody: fileMetadata,
		media,
		fields: 'id, name, mimeType, size, webViewLink, webContentLink',
	});

	if (!data.id || !data.name) {
		throw new Error('Failed to upload file to Google Drive');
	}

	await drive.permissions.create({
		fileId: data.id,
		requestBody: {
			role: 'reader',
			type: 'anyone',
		},
	});

	const publicUrl =
		data.webViewLink || `https://drive.google.com/file/d/${data.id}/view?usp=sharing`;

	return {
		id: data.id,
		name: data.name,
		mimeType: data.mimeType ?? undefined,
		size: data.size ? Number(data.size) : undefined,
		webViewLink: data.webViewLink,
		webContentLink: data.webContentLink,
		publicUrl,
	};
}

export async function deleteFromDrive(fileId: string): Promise<void> {
	const drive = getDriveClient();
	await drive.files.delete({ fileId });
}

