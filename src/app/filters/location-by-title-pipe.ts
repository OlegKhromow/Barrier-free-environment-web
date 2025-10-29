import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'elementsByString',
  pure: false
})
export class ElementsByStringPipe implements PipeTransform {

  transform<T extends Record<string, any>>(
    elements: T[],
    properties: string[],
    searchValues: string[]
  ): T[] {

    const filteredSearchValues = searchValues.map(s => s.trim());

    if (filteredSearchValues.every(s => s.length === 0)) {
      return elements;
    }

    return elements.filter(element =>
      properties.every((property, index) =>
        filteredSearchValues[index].length === 0 ||
        (filteredSearchValues[index].length > 0 &&
          element[property]?.toString().toLowerCase()
            .includes(filteredSearchValues[index].toLowerCase()))
      )
    );
  }
}
