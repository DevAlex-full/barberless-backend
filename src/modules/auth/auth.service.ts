import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@/generated/prisma/client';
import { UnauthorizedError, ConflictError } from '../../shared/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'barberless-secret-default';
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: { email: string; password: string }) {
    const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ConflictError('Este e-mail já está cadastrado');

    const passwordHash = await bcrypt.hash(data.password, 12);

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'CUSTOMER', // Strictly enforce CUSTOMER for public registration
      },
    });
  }

  async login(data: { email: string; password: string }, device?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new UnauthorizedError('E-mail ou senha inválidos');

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('E-mail ou senha inválidos');

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id, device);

    return { accessToken, refreshToken, user };
  }

  async refresh(token: string, device?: string) {
    const rt = await this.prisma.refreshToken.findUnique({ where: { token } });

    if (!rt || rt.expiresAt < new Date()) {
      throw new UnauthorizedError('Sessão expirada ou token inválido');
    }

    const user = await this.prisma.user.findUnique({ where: { id: rt.userId } });
    if (!user) throw new UnauthorizedError('Usuário não encontrado');

    // Rotate Refresh Token (Security Best Practice)
    await this.prisma.refreshToken.delete({ where: { id: rt.id } });
    const newRefreshToken = await this.generateRefreshToken(user.id, device);
    const newAccessToken = this.generateAccessToken(user);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
  }

  async logout(token: string) {
    try {
      await this.prisma.refreshToken.delete({ where: { token } });
    } catch {
      // Ignore if token doesn't exist
    }
  }

  private generateAccessToken(user: any) {
    return jwt.sign(
      { sub: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );
  }

  private async generateRefreshToken(userId: string, device?: string) {
    const token = jwt.sign(
      { sub: userId },
      JWT_SECRET + '_refresh',
      { expiresIn: `${REFRESH_TOKEN_EXPIRES_DAYS}d` }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        device,
        expiresAt,
      },
    });

    return token;
  }
}
