export interface AdditionalPage {
  _id?: string;
  name?: string;
  slug?: string;
  content?: string;
  description?: string;
  isHtml?: boolean;
  isActive?: boolean;
  showInFooter?: boolean;
  showInHeader?: boolean;
  footerGroup?: string;
  headerOrder?: number;
  footerOrder?: number;
  menuLabel?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
