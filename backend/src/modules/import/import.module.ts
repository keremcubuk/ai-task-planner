import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ImportParserService } from './import-parser.service';
import { ImportValidatorService } from './import-validator.service';
import { ImportMapperService } from './import-mapper.service';

@Module({
  controllers: [ImportController],
  providers: [
    ImportService,
    ImportParserService,
    ImportValidatorService,
    ImportMapperService,
  ],
})
export class ImportModule {}
