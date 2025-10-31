import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateDescriptionPipe'
})
export class TruncateDescriptionPipePipe implements PipeTransform {

 transform(value: string | null | undefined, maxLength: number = 100): string {
    if (!value) return '';

    if (value.length > maxLength) {
      return value.substring(0, maxLength) + '…';
    }

    return value;
  }

}
