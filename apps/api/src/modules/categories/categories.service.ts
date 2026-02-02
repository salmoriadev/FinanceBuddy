import { Injectable, NotFoundException } from "@nestjs/common";
import { CategoriesRepository } from "./categories.repository";
import { TtlCache } from "../../common/cache/ttl-cache";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  private readonly cache = new TtlCache<
    string,
    Awaited<ReturnType<CategoriesRepository["findAllByUser"]>>
  >(60_000);

  constructor(private readonly repository: CategoriesRepository) {}

  async findAll(userId: string) {
    const cached = this.cache.get(userId);
    if (cached) {
      return cached;
    }
    const categories = await this.repository.findAllByUser(userId);
    this.cache.set(userId, categories);
    return categories;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const created = await this.repository.create(userId, dto);
    this.cache.delete(userId);
    return created;
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const updated = await this.repository.update(userId, id, dto);
    if (!updated) {
      throw new NotFoundException("Categoria não encontrada");
    }
    this.cache.delete(userId);
    return updated;
  }

  async delete(userId: string, id: string) {
    const result = await this.repository.delete(userId, id);
    if (result.count === 0) {
      throw new NotFoundException("Categoria não encontrada");
    }
    this.cache.delete(userId);
    return { deleted: true };
  }
}
