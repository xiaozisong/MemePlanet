import { Injectable, NotFoundException, Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async findById(userId: string) {
    // TODO: 查 users + user_profiles
    this.logger.log(`findById ${userId}`);
    return { userId, nickname: 'placeholder', level: 1, memePower: 0, energyBalance: 100 };
  }

  async updateProfile(userId: string, dto: Record<string, unknown>) {
    // TODO: 昵称敏感词校验 + 30 天改一次限制 + UPDATE
    this.logger.log(`updateProfile ${userId}: ${JSON.stringify(dto)}`);
    return { userId, ...dto };
  }

  async updateInterestTags(userId: string, tags: string[]) {
    // TODO: 写 user_profiles.interest_tags + user_interest_tags
    this.logger.log(`updateInterestTags ${userId}: ${tags.join(',')}`);
    return { userId, interestTags: tags };
  }

  async getMemePower(userId: string) {
    // TODO: level = f(meme_power)
    return { userId, memePower: 0, level: 1, defenseValue: 0, energyBalance: 100 };
  }

  async deductEnergy(userId: string, cost: number): Promise<boolean> {
    // 乐观锁：UPDATE users SET energy_balance = energy_balance - cost
    //         WHERE user_id = ? AND energy_balance >= cost
    // TODO: 实现乐观锁
    void userId;
    void cost;
    throw new NotFoundException('deductEnergy 未实现');
  }
}
