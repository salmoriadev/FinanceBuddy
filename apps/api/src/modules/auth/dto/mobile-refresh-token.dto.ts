import { IsString, Matches } from "class-validator";

export class MobileRefreshTokenDto {
  @IsString()
  @Matches(/^[0-9a-f]{96}$/, {
    message: "refreshToken must be a valid refresh token",
  })
  refreshToken!: string;
}
