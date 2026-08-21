/**
 * Manages user categories with normalization-aware deduplication while reading
 * directly from persistence so replicas return current category metadata.
 */
import { Injectable } from "@nestjs/common";
import { CategoriesRepository } from "./categories.repository";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import {
  assertResourceDeleted,
  assertResourceFound,
} from "../../common/services/resource-assertions";

const normalizeCategoryName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .trim();

@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  async findAll(userId: string) {
    const categories = await this.repository.findAllByUser(userId);
    const unique = new Map<string, (typeof categories)[number]>();
    categories.forEach((category) => {
      const key = `${category.type}:${normalizeCategoryName(category.name)}`;
      if (!unique.has(key)) {
        unique.set(key, category);
      }
    });
    return Array.from(unique.values());
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const name = dto.name.trim();
    const existing = await this.repository.findByName(userId, name, dto.type);
    if (existing) {
      return existing;
    }

    const normalizedName = normalizeCategoryName(name);
    const all = await this.repository.findAllByUser(userId);
    const normalizedMatch = all.find(
      (category) =>
        category.type === dto.type &&
        normalizeCategoryName(category.name) === normalizedName,
    );
    if (normalizedMatch) {
      return normalizedMatch;
    }
    const created = await this.repository.create(userId, {
      ...dto,
      name,
    });
    return created;
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const updated = await this.repository.update(userId, id, dto);
    return assertResourceFound(updated, "Category not found");
  }

  async delete(userId: string, id: string) {
    const result = await this.repository.delete(userId, id);
    return assertResourceDeleted(result, "Category not found");
  }
}
