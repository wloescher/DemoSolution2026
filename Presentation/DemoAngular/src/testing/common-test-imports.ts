import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { GenericTableComponent } from '../app/generic-table/generic-table.component';

/**
 * The TestBed imports shared by every component and service spec, mirroring AppModule's own
 * imports so a component under test resolves the same dependencies it would at runtime.
 *
 *   RouterTestingModule   - Router + a stub ActivatedRoute (paramMap/snapshot), and router-outlet
 *   HttpClientTestingModule - HttpClient, which every *Service constructor-injects
 *   FormsModule           - ngModel in the edit templates
 *   FontAwesomeModule     - the <fa-icon> element used across the templates
 *   GenericTableComponent - standalone, used by the list templates
 *
 * Spread it so each spec keeps its own array:
 *
 *   TestBed.configureTestingModule({
 *     imports: [...COMMON_TEST_IMPORTS],
 *     declarations: [ClientListComponent],
 *   });
 */
export const COMMON_TEST_IMPORTS = [
    RouterTestingModule,
    HttpClientTestingModule,
    FormsModule,
    FontAwesomeModule,
    GenericTableComponent,
];
