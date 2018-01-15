import { Component, OnInit, OnDestroy, Input, Output, EventEmitter} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { LocalDataSource, ViewCell } from 'ng2-smart-table';

import { HttpClient } from '@angular/common/http';
import {ErrorStateMatcher} from '@angular/material/core';

@Component({
  selector: '${module_name}-create',
  templateUrl: './${module_name}-create.component.html',
})
export class ${angular_module_name}CreateComponent implements OnDestroy {

  websiteRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/;

  editProfileImage(){
    let input = <HTMLInputElement>document.getElementById('profile-image-input');
    input.click();
  }

  editImageOption:boolean = false;

  noImage:boolean = true;

  matcher = new MyErrorStateMatcher();

  minDate = new Date(2000, 0, 1);
  maxDate = new Date(2020, 0, 1);


  source: LocalDataSource;
  // screen actions will be decided by route action
  isCreateOrg = false;
  isViewOrg = false;
  isEditOrg = false;
  formState = {
    currentState: 1,
    validState: 1,
  }

  routerConnection;

  ngOnDestroy() {
    this.routerConnection.unsubscribe();
  }

  changeFormState(state) {
    if (state <= this.formState.validState) {
      this.formState.currentState = state;
    }
  }
  mappedLibraries = {};

  keyMaker(row) {
    return row.domain_Code + row.subdomain_Name;
  }
  settings = {
    actions: false,
    columns: {
      subdomain_Name: {
        title: 'Sub-Domain',
        type: 'number',
      },
      lib_Name: {
        title: 'Library',
        type: 'string',
      },
      lib_Version: {
        title: 'Library Version',
        type: 'string',
      },
    },
    hideSubHeader: true,
  };

  orgForm: FormGroup;

  defaultParameters;
  userParameters;

  countries;
  states;

  getStates(country) {
    let selectedCountry = country || this.orgForm.get("org_Country").value;
    this.http.get<any>(`http://ec2-13-127-27-144.ap-south-1.compute.amazonaws.com:8080/manage/getsetupvalue?type_Code=${selectedCountry}`).subscribe(res => {
      this.states = res.data;
    }, err => {
      alert("No states found for the selected Country");
      this.states = [];
    })
  }

  initializeCreateOrgForm() {
    this.orgForm = this.fb.group({
      'org_Code' : [{value: null, disabled: this.isViewOrg}, Validators.required],
      'org_City' : [{value: null, disabled: this.isViewOrg}, Validators.required],
      'org_Country' : [{value: null, disabled: this.isViewOrg}, Validators.required],
      'org_Desc' : [{value: null, disabled: this.isViewOrg}, Validators.required],
      'org_Ext' : [{value: null, disabled: this.isViewOrg}, Validators.required],
      'org_Name' : [{value: null, disabled: this.isViewOrg}, Validators.required],
      'org_Phone' : [{value: null, disabled: this.isViewOrg}, Validators.required],
      'org_Remarks' : [{value: null, disabled: this.isViewOrg}, Validators.required],
      'org_State' : [{value: null, disabled: this.isViewOrg}, Validators.required],
      'org_Add_Date' : [{value: null, disabled: this.isViewOrg}, Validators.required],
      'org_Website' : [{value: null, disabled: this.isViewOrg},  Validators.compose([Validators.required, Validators.pattern(this.websiteRegex)])],
      'org_Address' : [{value: null, disabled: this.isViewOrg}, Validators.required],
      'org_Close_Date': [{value: null, disabled: this.isViewOrg}],
    });
  }
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
  ) {
    this.initializeCreateOrgForm();

    this.http.get<any>('http://ec2-13-127-27-144.ap-south-1.compute.amazonaws.com:8080/getdefaultidparameters').subscribe(res => {
      this.defaultParameters = res.data;
      this.userParameters = this.defaultParameters.filter(param => param.managed_By_Org_Ind === "Y");
    })

    this.http.get<any>('http://ec2-13-127-27-144.ap-south-1.compute.amazonaws.com:8080/manage/getsetupvalue?type_Code=CNTRY_CD').subscribe(res => {
      this.countries = res.data;
    })

    this.routerConnection = router.events.subscribe((event) => {
      if (event instanceof NavigationEnd ) {
        const [action, orgName ] = event.url.split('/').slice(3);

        if (orgName) {

          this.http.get<GetOrganization>
            (`http://ec2-13-127-27-144.ap-south-1.compute.amazonaws.com:8080/manageorg/getorgbyname?org_Name=${orgName}`).subscribe(res => {
              this.getStates(res.data[0].org_Country);
              this.orgForm.patchValue(res.data[0]);

              let orgCode = this.orgForm.get('org_Code').value;
              this.http.get<any>(`http://ec2-13-127-27-144.ap-south-1.compute.amazonaws.com:8080/getassignsubdomainlib?org_Code=${orgCode}`).subscribe(res => {
                let data = res.data;
                data.map(row => {
                  row.enabled = true;
                  return row;
                })
                this.source = new LocalDataSource(data);
              });
            });
        } else {
          this.http.get<any>('http://ec2-13-127-27-144.ap-south-1.compute.amazonaws.com:8080/getdomsubdomainlib').subscribe(res => {
             this.source = new LocalDataSource(res.data);
          });
        }

        // available actions
        if (action === 'create') {
          this.isCreateOrg = true;
        }
        if (action === 'view') {
          // set create org fields to be uneditable
          this.isViewOrg = true;
          this.initializeCreateOrgForm();
          this.fileSelected = true;
          this.orgForm.reset(this.orgForm.value);
        } else if (action === 'edit') {
          this.isEditOrg = true;
        }
      }
    });
  }

  fileSelected;
  formdata;

  imageExtenstions = ['jpg', 'jpeg', 'png'];

  // returns file extention
  fetchFileExtention(fname) {
    return fname.slice((fname.lastIndexOf(".") - 1 >>> 0) + 2);
  }

  // return if file extension of image type
  isImageFileExtention(fileExt) {
    return this.imageExtenstions.some(ext => ext === fileExt.toLowerCase());
  }

  fileChange(event:any){
    let files = event.target.files;
    if(files.length>0){

      let fileExtension = this.fetchFileExtention(files[0].name);

      if (this.isImageFileExtention(fileExtension)) {
        this.formdata = new FormData();
        this.formdata.append('org_Logo', event.target.files[0]);
        this.fileSelected = event.target.files.length ? true : false;

        let reader:any;
        reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profile-img')
                .setAttribute('src', e.target.result);
        }
        this.noImage = false;
        reader.readAsDataURL(files[0]);
      } else {
        alert('Only images are allowed');
      }

    }
  }


  mapLibrary() {
    let dataToSend = [];
    for(var key in this.mappedLibraries) {
      var row = this.mappedLibraries[key];

      var formattedData = {
        "id" : {
        "org_Code" : this.orgForm.controls["org_Code"].value,
        "domain_Code" : row.domain_Code,
        "subdomain_Code" : row.subdomain_Code,
        },
         "lib_Code" : row.lib_Code,
         "lib_Version" : row.lib_Version,
      }

      dataToSend.push(formattedData);
    }

    this.http.post<any>('http://ec2-13-127-27-144.ap-south-1.compute.amazonaws.com:8080/addassignsubdomainlib', dataToSend).subscribe(res => {
       this.formState.currentState = 3;
       this.formState.validState = 3;
     }, err => {
       if (err.status === 406) {
         this.formState.currentState = 3;
       } else {
         alert(err.error.message);
       }
     });

  }

  createOrganization(val) {
    if (this.isViewOrg) {
      this.formState.currentState = 2;
      this.formState.validState = 2;
    } else if (this.isEditOrg) {
      this.http.put<OrganizationResponse>('http://ec2-13-127-27-144.ap-south-1.compute.amazonaws.com:8080/manageorg/editorg', val).subscribe(res => {
        this.formState.currentState = 2;
        this.formState.validState = 2;
      }, err => {
        alert(err.error.message);
      });
    } else {
      this.formdata.delete('orgD');
      this.formdata.append('orgD', JSON.stringify(val));
      this.http.post<OrganizationResponse>('http://ec2-13-127-27-144.ap-south-1.compute.amazonaws.com:8080/manageorg/addorg', this.formdata).subscribe(res => {
        this.formState.currentState = 2;
        this.formState.validState = 2;
        this.isCreateOrg = false;
        this.isEditOrg = true;
       }, err => {
         alert(err.error.message);
       });
    }
  }

  completeConfig() {
    let nonUserParams = this.defaultParameters.filter(param => param.managed_By_Org_Ind === "N");
    var formattedData = this.userParameters.concat(nonUserParams).map(parameter => {
      return {
        "id" : {
        "org_Code" : this.orgForm.controls["org_Code"].value,
        "entity_Name" : parameter.entity_Name
        },
        "managed_By_Org_Ind": parameter.managed_By_Org_Ind,
        "id_Counter" : parameter.id_Counter,
        "id_Prefix" : parameter.id_Prefix,
        "id_Suffix" : parameter.id_Suffix,
        "no_Of_Digits" : parameter.no_Of_Digits
      }
    });

    this.http.post<any>('http://ec2-13-127-27-144.ap-south-1.compute.amazonaws.com:8080/addmanageidparameters', formattedData).subscribe(res => {
       this.router.navigate(['/pages/organizations/view']);
     }, err => {
       if (err.status === 406) {
         this.router.navigate(['/pages/organizations/view']);
       } else {
         alert(err.error.message);
       }
     });
  }

  // refactor the logo component
  profileImageOver(){
    this.editImageOption = true;
  }

  profileImageLeave(){
    this.editImageOption = false;
  }

  _keyPress(e: any) {
    const pattern = /[0-9]/;
    let charCode = String.fromCharCode(e.charCode).toLowerCase();

    let keyCode = e.keyCode;
    // allow ctrl actions for firefox
    if (e.ctrlKey) {
      if (charCode == 'x' || charCode == 'c' || charCode == 'v') {
        return true;
      }
    }
    // Left / Up / Right / Down Arrow, Backspace, Delete keys
    if(keyCode == 37 || keyCode == 38 || keyCode == 39 ||
      keyCode == 40 || keyCode == 8 || keyCode == 46) {
        return true;;
    }
    let inputChar = String.fromCharCode(e.charCode);

    if (!pattern.test(inputChar)) {
      e.preventDefault();
    }
  }
}



interface OrganizationResponse {
  code: string,
  error?: any,
  data?: string,
  message?: string,
  status: string,
}

interface GetOrganization {
  data: any;
}


/** Error when invalid control is dirty, touched, or submitted. */
// TODO: Move this out of here, make a generic class
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}
