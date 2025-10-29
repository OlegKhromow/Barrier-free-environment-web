import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'locationByStatus'
})
export class LocationByStatusPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
