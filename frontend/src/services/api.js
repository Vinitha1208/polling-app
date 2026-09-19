// Voter token utility for client deduplication fingerprint
export const getVoterToken = () => {
  let token = localStorage.getItem('poll_voter_token');
  if (!token) {
    token = 'voter_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('poll_voter_token', token);
  }
  return token;
};

// Base fetch wrapper
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('poll_auth_token');
  const voterToken = getVoterToken();

  const headers = {
    'Content-Type': 'application/json',
    'X-Voter-ID': voterToken,
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Network request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // Auth
  signup: (userData) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/api/auth/me', { method: 'GET' }),

  // Polls
  createPoll: (pollData) => request('/api/polls', { method: 'POST', body: JSON.stringify(pollData) }),
  getMyPolls: () => request('/api/polls/my', { method: 'GET' }),
  getPollById: (id) => request(`/api/polls/${id}`, { method: 'GET' }),
  getPollByShareCode: (shareCode) => request(`/api/polls/share/${shareCode}`, { method: 'GET' }),
  getPollResults: (id) => request(`/api/polls/${id}/results`, { method: 'GET' }),
  closePoll: (id) => request(`/api/polls/${id}/close`, { method: 'POST' }),
  deletePoll: (id) => request(`/api/polls/${id}`, { method: 'DELETE' }),

  // Voting
  castVote: (pollId, optionId) =>
    request(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({
        option_id: optionId,
        voter_id: getVoterToken(),
      }),
    }),
};
