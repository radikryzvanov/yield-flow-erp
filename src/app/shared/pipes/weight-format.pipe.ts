import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'weightFormat'
})
export class WeightFormatPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
