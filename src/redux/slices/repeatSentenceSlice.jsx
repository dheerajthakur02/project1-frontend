import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetching from your specific endpoint
export const fetchRepeatSentences = createAsyncThunk(
  'repeatSentence/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/repeat-sentence/all');
      // Assuming your API returns { success: true, data: [...] }
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch questions');
    }
  }
);

const repeatSentenceSlice = createSlice({
  name: 'repeatSentence',
  initialState: {
    questions: [],
    loading: false,
    error: null,
    lastFetched: null, // To track if we already have data
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRepeatSentences.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRepeatSentences.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload;
        state.lastFetched = Date.now(); // Mark as fetched
      })
      .addCase(fetchRepeatSentences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default repeatSentenceSlice.reducer;