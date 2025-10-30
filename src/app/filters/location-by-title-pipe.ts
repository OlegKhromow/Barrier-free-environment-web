import { Pipe, PipeTransform } from '@angular/core';
import { LocationStatusEnum } from '../core/models/location-status-enum';

@Pipe({
  name: 'elementsByString',
  pure: false
})
export class ElementsByStringPipe implements PipeTransform {

 transform<T extends Record<string, any>>(
    elements: T[],
    properties: string[],
    searchValues: string[],
    selectedTypeId?: string,
    selectedStatus?: LocationStatusEnum | 'all'
  ): T[] {
    if (!elements) return [];

    const filteredSearchValues = searchValues.map(s => s?.trim().toLowerCase() ?? '');

    // 1. Фільтр по тексту (name, description і т.д.)
    let filtered = elements;
    if (!filteredSearchValues.every(s => s.length === 0)) {
      filtered = filtered.filter(element =>
        properties.every((property, index) =>
          filteredSearchValues[index].length === 0 ||
          element[property]?.toString().toLowerCase().includes(filteredSearchValues[index])
        )
      );
    }

    //2. Фільтр по типу локації
  if (selectedTypeId && selectedTypeId !== 'all') {
      filtered = filtered.filter(el => el['type']?.id === selectedTypeId);
    }

    //3. Фільтр по статусу
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(el => el['status'] === selectedStatus);
    }


    return filtered;
  }
}
