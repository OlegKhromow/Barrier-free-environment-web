import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'locationByText'
})
export class LocationByTextPipe implements PipeTransform {

  transform<T extends Record<string, any>>(
    elements: T[],
    properties: string[],
    searchValues: string[],
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

    return filtered;
  }

}
