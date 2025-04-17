const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  patterns,
  messages
} = require('../../../validations/authValidation');

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const data = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        confirmPassword: 'Test@123',
        role: 'employee'
      };

      const { error, value } = registerSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value).toEqual(data);
    });

    it('should require name', () => {
      const data = {
        email: 'test@example.com',
        password: 'Test@123',
        confirmPassword: 'Test@123'
      };

      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('should validate name format', () => {
      const data = {
        name: '12345', // Invalid name format
        email: 'test@example.com',
        password: 'Test@123',
        confirmPassword: 'Test@123'
      };

      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toContain(messages.name);
    });

    it('should validate email format', () => {
      const data = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'Test@123',
        confirmPassword: 'Test@123'
      };

      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    it('should validate password strength', () => {
      const data = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak'
      };

      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toContain(messages.password);
    });

    it('should validate password confirmation', () => {
      const data = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        confirmPassword: 'Different@123'
      };

      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('confirmPassword');
    });

    it('should validate role enum', () => {
      const data = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        confirmPassword: 'Test@123',
        role: 'invalid-role'
      };

      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('role');
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'Test@123'
      };

      const { error, value } = loginSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value).toEqual(data);
    });

    it('should require email', () => {
      const data = {
        password: 'Test@123'
      };

      const { error } = loginSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    it('should require password', () => {
      const data = {
        email: 'test@example.com'
      };

      const { error } = loginSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('password');
    });
  });

  describe('updateProfileSchema', () => {
    it('should validate valid profile update', () => {
      const data = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const { error, value } = updateProfileSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value).toEqual(data);
    });

    it('should validate password update', () => {
      const data = {
        currentPassword: 'Current@123',
        newPassword: 'New@123',
        confirmNewPassword: 'New@123'
      };

      const { error, value } = updateProfileSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value).toEqual(data);
    });

    it('should require current password when updating password', () => {
      const data = {
        newPassword: 'New@123',
        confirmNewPassword: 'New@123'
      };

      const { error } = updateProfileSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('currentPassword');
    });

    it('should validate password confirmation match', () => {
      const data = {
        currentPassword: 'Current@123',
        newPassword: 'New@123',
        confirmNewPassword: 'Different@123'
      };

      const { error } = updateProfileSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('confirmNewPassword');
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate valid password change', () => {
      const data = {
        currentPassword: 'Current@123',
        newPassword: 'New@123',
        confirmNewPassword: 'New@123'
      };

      const { error, value } = changePasswordSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value).toEqual(data);
    });

    it('should validate password strength', () => {
      const data = {
        currentPassword: 'Current@123',
        newPassword: 'weak',
        confirmNewPassword: 'weak'
      };

      const { error } = changePasswordSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toContain(messages.password);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate valid email', () => {
      const data = {
        email: 'test@example.com'
      };

      const { error, value } = forgotPasswordSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value).toEqual(data);
    });

    it('should validate email format', () => {
      const data = {
        email: 'invalid-email'
      };

      const { error } = forgotPasswordSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate valid password reset', () => {
      const data = {
        token: 'valid-token',
        password: 'New@123',
        confirmPassword: 'New@123'
      };

      const { error, value } = resetPasswordSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value).toEqual(data);
    });

    it('should require token', () => {
      const data = {
        password: 'New@123',
        confirmPassword: 'New@123'
      };

      const { error } = resetPasswordSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('token');
    });
  });

  describe('Patterns', () => {
    it('should validate password pattern', () => {
      const validPasswords = ['Test@123', 'Complex$1Password', 'Secure#2023'];
      const invalidPasswords = ['weak', 'nodigit@', 'NOUPPER1@', 'nolower1@'];

      validPasswords.forEach(password => {
        expect(patterns.password.test(password)).toBe(true);
      });

      invalidPasswords.forEach(password => {
        expect(patterns.password.test(password)).toBe(false);
      });
    });

    it('should validate name pattern', () => {
      const validNames = ['John Doe', 'María José', "O'Connor"];
      const invalidNames = ['123Name', 'Name@123', 'A'];

      validNames.forEach(name => {
        expect(patterns.name.test(name)).toBe(true);
      });

      invalidNames.forEach(name => {
        expect(patterns.name.test(name)).toBe(false);
      });
    });
  });
});
