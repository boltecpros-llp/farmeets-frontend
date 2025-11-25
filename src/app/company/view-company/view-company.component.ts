import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiHelperService } from '../../shared/api-helper.service';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-view-company',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule],
  templateUrl: './view-company.component.html',
  styleUrls: ['./view-company.component.scss']
})
export class ViewCompanyComponent implements OnInit {
  isLoading = false;
    // Returns true if the given member is NOT the current user
    isNotSelfMember(member: any): boolean {
      const userId = localStorage.getItem('userId');
      return member?.id !== userId;
    }
  company: any = null;
  members: any[] = [];
  roles: any[] = [];
  users: any[] = [];
  activeTab: 'info' | 'members' = 'info';
  @ViewChild('addMemberModal') addMemberModalRef!: TemplateRef<any>;
  selectedUser: string | null = null;
  selectedRole: string | null = null;
  modalRef: NgbActiveModal | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiHelperService,
    public modalService: NgbModal,
    private toast: ToastService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.get(`/accounts/company/${id}/`).subscribe({
        next: (data: any) => {
          this.company = data;

          /* this.company.members = [
            {
              "id": "1369674b-3637-4b9c-a337-f2cecfd3dd94",
              "email": "vhshetkar@gmail.com",
              "firstName": "Vilas mod",
              "lastName": "Shetkar",
              "mobile": "9049508514",
              "roles": [
                "company_admin"
              ]
            }
          ] */

          this.fetchMembers();
        },
        error: err => console.error(err)
      });
    }
  }

  fetchMembers() {
    // Members are part of the current company object
    this.members = Array.isArray(this.company?.members) ? this.company.members : [];
  }

  fetchRolesAndUsers() {
    this.api.get('/accounts/roles/?name=company').subscribe({
      next: (data: any) => this.roles = Array.isArray(data) ? data : (data?.results || []),
      error: err => console.error(err)
    });
    this.api.get('/accounts/users/').subscribe({
      next: (data: any) => this.users = Array.isArray(data) ? data : (data?.results || []),
      error: err => console.error(err)
    });
  }

  setTab(tab: 'info' | 'members') {
    this.activeTab = tab;
    if (tab === 'members') {
      this.fetchMembers();
    }
  }

  removeMember(userId: string) {
    if (!this.company?.id) return;
    this.api.post(`/accounts/company/${this.company.id}/remove-member/`, { user_id: userId }).subscribe({
      next: () => this.fetchMembers(),
      error: err => console.error(err)
    });
  }

  openAddMemberModal() {
    this.fetchRolesAndUsers();
    this.selectedUser = null;
    this.selectedRole = null;
    const modalRef = this.modalService.open(this.addMemberModalRef, { centered: true });
    modalRef.result.then((result: any) => {
      if (result === 'add' && this.selectedUser && this.selectedRole && this.company?.id) {

      }
    }, () => { });
  }

  addMember() {
    this.isLoading = true;
    this.api.post(`/accounts/company/${this.company.id}/add-member/`, {
      user_id: this.selectedUser,
      role_id: this.selectedRole
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.fetchMembers();
        this.toast.show('Member added successfully!', 'success', 3000);
        // Reset form for next entry, keep modal open
        this.selectedUser = null;
        this.selectedRole = null;
        this.modalService.dismissAll();
      },
      error: err => {
        this.isLoading = false;
        this.toast.show('Failed to add member', 'error', 3000);
        console.error(err);
      }
    });
  }

  get categoryNames(): string {
    return Array.isArray(this.company?.categories) && this.company.categories.length
      ? this.company.categories.map((c: any) => c.name).join(', ')
      : '';
  }

  get languageNames(): string {
    return Array.isArray(this.company?.languages) && this.company.languages.length
      ? this.company.languages.map((l: any) => l.name).join(', ')
      : '';
  }

  // Returns true if the current user is a company_admin in company.members
  get isCompanyAdmin(): boolean {
    const userId = localStorage.getItem('userId');
    return Array.isArray(this.company?.members)
      ? this.company.members.some((m: any) => m.id === userId && Array.isArray(m.roles) && m.roles.includes('company_admin'))
      : false;
  }

}