import React from 'react';
import { useParams } from 'react-router-dom';

const FileDetail = () => {
  const { id } = useParams();
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/files/${id}/download`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = id; // Use the file ID or another method to name the file
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Error downloading file. Please check the file code and try again.');
    }
  };

  return (
    <div>
      <h1>File Detail</h1>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter code to download"
      />
      <button onClick={handleDownload}>Download File</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default FileDetail;
