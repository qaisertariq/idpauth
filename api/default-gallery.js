const OAuth = require('oauth-1.0a');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', async () => {
    try {
      const { accessToken, accessTokenSecret, nickname, urlname, privacy, templateuri} = JSON.parse(body);

      if (!accessToken || !accessTokenSecret || !nickname || !urlname || !privacy || !templateuri) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const oauth = OAuth({
        consumer: {
          key: process.env.SMUGMUG_CONSUMER_KEY,
          secret: process.env.SMUGMUG_CONSUMER_SECRET,
        },
        signature_method: 'HMAC-SHA1',
        hash_function(base_string, key) {
          return crypto.createHmac('sha1', key).update(base_string).digest('base64');
        },
      });

      const url = `https://api.smugmug.com/api/v2/album/${urlname}`;
      const method = 'PATCH';

      const data = {
                    Privacy: "Unlisted",
                    AllowDownloads: true,  
                    CanRank: true,
                    Clean: false,
                    Comments: false,
                    EXIF: false,
                    External: true,
                    FamilyEdit: false,
                    Filenames: false,
                    FriendEdit: false,
                    Geography: true,
                    Header: "Custom",
                    HideOwner: false, 
                    LargestSize: "Original",
                    MaxPhotoDownloadSize: "Original",
                    PackagingBranding: true,
                    Printable: false,
                    ProofDays: 0,
                    ProofDigital: false,
                    Protected: true, 
                    Public: false,
                    Share: true,
                    ShowCoverImage: false,
                    Slideshow: true,
                    SmugSearchable: "Inherit from User",
                    SortDirection: "Ascending",
                    SortMethod: "Position",
                    SquareThumbs: false,
                    Watermark: true,
                    WorldSearchable: true,
                    CommerceLightbox: false,
                 
      };
      

      const authHeader = oauth.toHeader(
        oauth.authorize({ url, method }, { key: accessToken, secret: accessTokenSecret })
      );
    

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: authHeader.Authorization,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed', details: result });
      }

      return res.status(200).json({ message: 'Folder created successfully', result });
    } catch (err) {
      return res.status(500).json({ error: 'Unexpected error', details: err.message });
    }
  });
};
