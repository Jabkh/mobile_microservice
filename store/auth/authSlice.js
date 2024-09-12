import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseURL = 'http://localhost:8080/api';

const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

export const login = createAsyncThunk('auth/login', async (credentials, thunkAPI) => {
    try {
        const response = await axios.post(`${baseURL}/auth/login`, credentials);
        setAuthToken(response.data.token);
        return response.data;  // Ensure response.data includes token and user details
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Something went wrong');
    }
});

export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
    try {
        await axios.post(`${baseURL}/auth/register`, userData);
        const response = await thunkAPI.dispatch(login({ email: userData.email, password: userData.password }));
        return response.payload;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Something went wrong during registration');
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        token: null,
        loading: false,
        error: null,
    },
    reducers: {
        logout: (state) => {
            AsyncStorage.removeItem('token');
            state.user = null;
            state.token = null;
            setAuthToken(null);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;  // Ensure response.data includes user
                state.token = action.payload.token;  // Ensure response.data includes token
                setAuthToken(action.payload.token);
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;  // Ensure login action's payload includes user
                state.token = action.payload.token;  // Ensure login action's payload includes token
                setAuthToken(action.payload.token);
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;