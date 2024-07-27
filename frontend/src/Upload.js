import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [downloadFileId, setDownloadFileId] = useState(null);
  const [downloadCode, setDownloadCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/files', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setFiles(response.data);
    } catch (err) {
      setError('Error fetching files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }
  
    setLoading(true);
    setError('');
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
  
      if (response.status === 200) {
        // Assuming the server response contains file details
        setFiles([...files, response.data]);
        setFile(null); // Clear the selected file after upload
      } else {
        setError('Failed to upload file');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Error uploading file');
    } finally {
      setLoading(false);
    }
  };
  

  const handleFileDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`/api/files/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setFiles(files.filter((file) => file.id !== id));
    } catch (err) {
      setError('Error deleting file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId) => {
    if (!downloadCode) {
      setError('Please enter the download code');
      return;
    }
  
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`/api/files/${fileId}/download`, { code: downloadCode }, {
        responseType: 'blob', // Important for handling file downloads
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
  
      // Extract the filename from Content-Disposition header
      const disposition = response.headers['content-disposition'];
      const filename = disposition
        ? disposition.split('filename=')[1].replace(/"/g, '')
        : 'downloaded-file';
  
      // Create a URL for the file and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Error downloading file: Invalid code or file ID');
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <div>
      <h1>File Upload</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload} disabled={loading}>Upload</button>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <h2>Uploaded Files</h2>
      <ul>
        {files.map((file) => (
          <li key={file.id}>
            {file.name} - {file.code}
            <button onClick={() => setDownloadFileId(file.id)}>Download</button>
            <button onClick={() => handleFileDelete(file.id)}>Delete</button>
          </li>
        ))}
      </ul>
      {downloadFileId && (
        <div>
          <input
            type="text"
            value={downloadCode}
            onChange={(e) => setDownloadCode(e.target.value)}
            placeholder="Enter code"
          />
          <button onClick={() => handleDownload(downloadFileId)}>Download File</button>
        </div>
      )}
    </div>
  );
};

export default Upload;
