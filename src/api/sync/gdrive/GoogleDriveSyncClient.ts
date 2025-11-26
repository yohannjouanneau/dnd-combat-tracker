/**
 * Simple Google Drive sync client for JSON data using appDataFolder
 * Uses Google API JavaScript client library (gapi)
 * 
 * Required scripts in HTML:
 * <script src="https://accounts.google.com/gsi/client" async defer></script>
 * <script src="https://apis.google.com/js/api.js" async defer></script>
 * 
 * Required npm packages:
 * npm install --save-dev @types/gapi @types/gapi.client.drive @types/google.accounts
 * 
 * Usage:
 * const client = new GoogleDriveSyncClient('YOUR_CLIENT_ID.apps.googleusercontent.com');
 * await client.authorize();
 * await client.save({ your: 'data' });
 * const data = await client.load();
 */

export class GoogleDriveSyncClient {
  private accessToken: string | null = null;
  private readonly clientId: string;
  private readonly fileName: string;
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private gapiInitialized = false;

  constructor(clientId: string, fileName: string = 'app-data.json') {
    this.clientId = clientId;
    this.fileName = fileName;
  }

  /**
   * Initialize GAPI client
   */
  private async initGapi(): Promise<void> {
    if (this.gapiInitialized) return;

    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error('GAPI not loaded. Add <script src="https://apis.google.com/js/api.js"></script> to your HTML'));
        return;
      }

      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          this.gapiInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Initialize and authorize with Google Drive
   * Opens OAuth consent window
   */
  async authorize(): Promise<void> {
    await this.initGapi();

    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services not loaded. Add <script src="https://accounts.google.com/gsi/client"></script> to your HTML'));
        return;
      }

      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: 'https://www.googleapis.com/auth/drive.appdata',
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          this.accessToken = response.access_token;
          gapi.client.setToken({ access_token: response.access_token });
          resolve();
        },
      });

      this.tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  async revoke(): Promise<void> {
    
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services not loaded. Add <script src="https://accounts.google.com/gsi/client"></script> to your HTML'));
        return;
      }

      if (this.accessToken) {
        google.accounts.oauth2.revoke(this.accessToken, () => {
          resolve()
        })
      }
    });
  }
 

  /**
   * Save JSON data to Google Drive appDataFolder
   */
  async save<T = unknown>(data: T): Promise<string> {
    if (!this.accessToken || !this.gapiInitialized) {
      throw new Error('Not authorized. Call authorize() first.');
    }

    // Check if file already exists
    const existingFile = await this.findFile();

    const content = JSON.stringify(data, null, 2);

    if (existingFile) {
      // Update existing file content
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: content,
        }
      );

      return existingFile.id || '';
    } else {
      // Step 1: Create file with metadata
      const response = await gapi.client.drive.files.create({
        resource: {
          name: this.fileName,
          mimeType: 'application/json',
          parents: ['appDataFolder'],
        },
        fields: 'id',
      });

      const fileId = response.result.id;

      if (!fileId) {
        throw new Error('Failed to create file: no ID returned');
      }

      // Step 2: Upload content
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: content,
        }
      );

      return fileId;
    }
  }

  /**
   * Load JSON data from Google Drive appDataFolder
   * Returns null if file doesn't exist
   */
  async load<T = unknown>(): Promise<T | null> {
    if (!this.accessToken || !this.gapiInitialized) {
      throw new Error('Not authorized. Call authorize() first.');
    }

    const file = await this.findFile();

    if (!file) {
      return null;
    }

    try {
      const response = await gapi.client.drive.files.get({
        fileId: file.id ?? '',
        alt: 'media',
      });

      // Parse the response body which contains the JSON content
      return response.result as T;
    } catch (error) {
      console.error('Failed to load file:', error);
      throw new Error('Failed to load file from Drive');
    }
  }

  /**
   * Check if authorized
   */
  isAuthorized(): boolean {
    return this.accessToken !== null && this.gapiInitialized;
  }

  /**
   * Find existing file in appDataFolder
   */
  private async findFile(): Promise<gapi.client.drive.File | null> {
    try {
      const response = await gapi.client.drive.files.list({
        spaces: 'appDataFolder',
        q: `name='${this.fileName}'`,
        fields: 'files(id, name)',
        pageSize: 1,
      });

      const files = response.result.files;
      return files && files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error('Failed to search for file:', error);
      throw new Error('Failed to search for file');
    }
  }
}