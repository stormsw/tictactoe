import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LoginForm from '../components/Auth/LoginForm';

// Mock the useAuthStore hook
const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('../hooks/useAuthStore', () => ({
    useAuthStore: () => ({
        login: mockLogin,
        register: mockRegister,
    }),
}));

describe('LoginForm Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders login form by default', () => {
        render(<LoginForm />);

        expect(screen.getByText('Sign in')).toBeInTheDocument();
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    });

    test('toggles to registration form', () => {
        render(<LoginForm />);

        const toggleButton = screen.getByText("Don't have an account? Sign up");
        fireEvent.click(toggleButton);

        expect(screen.getByText('Sign up')).toBeInTheDocument();
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    test('handles login form submission', async () => {
        mockLogin.mockResolvedValue(true);
        render(<LoginForm />);

        const usernameInput = screen.getByLabelText('Username');
        const passwordInput = screen.getByLabelText('Password');
        const submitButton = screen.getByRole('button', { name: 'Sign in' });

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
        });
    });

    test('handles registration form submission', async () => {
        mockRegister.mockResolvedValue(true);
        render(<LoginForm />);

        // Switch to registration form
        fireEvent.click(screen.getByText("Don't have an account? Sign up"));

        const usernameInput = screen.getByLabelText('Username');
        const emailInput = screen.getByLabelText('Email');
        const passwordInput = screen.getByLabelText('Password');
        const submitButton = screen.getByRole('button', { name: 'Sign up' });

        fireEvent.change(usernameInput, { target: { value: 'newuser' } });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith('newuser', 'test@example.com', 'password123');
        });
    });

    test('displays error message on login failure', async () => {
        mockLogin.mockResolvedValue(false);
        render(<LoginForm />);

        const usernameInput = screen.getByLabelText('Username');
        const passwordInput = screen.getByLabelText('Password');
        const submitButton = screen.getByRole('button', { name: 'Sign in' });

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    test('displays error message on registration failure', async () => {
        mockRegister.mockResolvedValue(false);
        render(<LoginForm />);

        // Switch to registration form
        fireEvent.click(screen.getByText("Don't have an account? Sign up"));

        const usernameInput = screen.getByLabelText('Username');
        const emailInput = screen.getByLabelText('Email');
        const passwordInput = screen.getByLabelText('Password');
        const submitButton = screen.getByRole('button', { name: 'Sign up' });

        fireEvent.change(usernameInput, { target: { value: 'newuser' } });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Registration failed')).toBeInTheDocument();
        });
    });
});
