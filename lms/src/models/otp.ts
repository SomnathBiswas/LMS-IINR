// OTP model for email verification

export interface OTP {
  email: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
}

export function createOTPRecord(email: string, otp: string): OTP {
  // OTP expires in 10 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  
  return {
    email,
    otp,
    createdAt: new Date(),
    expiresAt,
    verified: false
  };
}

export function isOTPExpired(otp: OTP): boolean {
  return new Date() > otp.expiresAt;
}
