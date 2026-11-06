import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UnauthorizedException } from '@nestjs/common';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { AdminRolesGuard } from './admin-roles.guard';
import { AdminPermissionGuard } from './admin-permission.guard';
import { ADMIN_ROLES_KEY } from '../core/global-variables';
import { ADMIN_PERMISSIONS_KEY } from '../decorator/admin-permissions.decorator';
import { AdminRoles } from '../enum/admin-roles.enum';
import { AdminPermissions } from '../enum/admin-permission.enum';

import { ActivitiesCommentController } from '../pages/activities-comments/activities-comment.controller';
import { ActivitiesController } from '../pages/activities/activities/activities.controller';
import { AdminController } from '../pages/admin/admin.controller';
import { BlogCommentController } from '../pages/blog-comments/blog-comment.controller';
import { BlogController } from '../pages/blog/blog/blog.controller';
import { AuthorController } from '../pages/catalog/author/author.controller';
import { PublisherController } from '../pages/catalog/publisher/publisher.controller';
import { ContactController } from '../pages/contact/contact/contact.controller';
import { NewsletterController } from '../pages/contact/newsletter/newsletter.controller';
import { BannerCaroselController } from '../pages/customization/banner/banner-carosel.controller';
import { CarouselController } from '../pages/customization/carousel/carousel.controller';
import { FileFolderController } from '../pages/file-folder/file-folder.controller';
import { GalleryController } from '../pages/gallery/gallery.controller';
import { ManuscriptController } from '../pages/manuscript/manuscript.controller';
import { NotificationController } from '../pages/notification/notification.controller';
import { CouponController } from '../pages/offers/coupon/coupon.controller';
import { MultiPromoOfferController } from '../pages/offers/multi-promo-offer/multi-promo-offer.controller';
import { PromoOfferController } from '../pages/offers/promo-offer/promo-offer.controller';
import { SpecialPackageController } from '../pages/offers/special-package/special-package.controller';
import { PraptisthanaController } from '../pages/praptisthana/praptisthana.controller';
import { PreOrderController } from '../pages/pre-order/pre-order.controller';
import { ProductController } from '../pages/product/product.controller';
import { ProfileController } from '../pages/profile/profile/profile.controller';
import { ReviewController } from '../pages/review/review.controller';
import { OrderController } from '../pages/sales/order/order.controller';
import { UploadController } from '../pages/upload/upload.controller';
import { UserController } from '../pages/user/user.controller';
import { YoutubeVideoController } from '../pages/youtube-video/youtube-video.controller';

/**
 * Regression guard for the admin-route lockdown.
 *
 * These handlers create, change or delete store data (or list private data
 * such as orders and contact messages). They previously had their admin guard
 * decorators commented out — or never had one — so anyone on the internet
 * could call them. Every handler below must require the admin JWT
 * (`administrator` header). If one is intentionally made public again, remove
 * it from this list in the same change and explain why.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
const ADMIN_ONLY: Array<[Function, string[]]> = [
  [ActivitiesCommentController, ['addActivitiesCommentByAdmin']],
  [ActivitiesController, ['addActivities', 'updateActivitiesById', 'deleteActivitiesById']],
  [AdminController, ['adminSignup']],
  [BlogCommentController, ['addBlogCommentByAdmin']],
  [BlogController, ['addBlog', 'updateBlogById', 'deleteBlogById']],
  [AuthorController, ['addAuthor', 'updateAuthorById', 'deleteAuthorById']],
  [PublisherController, ['addPublisher', 'updatePublisherById', 'deletePublisherById']],
  [ContactController, ['getAllContacts', 'updateContactById', 'deleteContactById']],
  [NewsletterController, ['getAllNewsletters', 'updateNewsletterById', 'deleteNewsletterById']],
  [BannerCaroselController, ['addBannerCarosel', 'updateBannerCaroselById', 'deleteBannerCaroselById']],
  [CarouselController, ['addCarousel', 'updateCarouselById', 'deleteCarouselById']],
  [FileFolderController, ['getAllFileFoldersByAdmin']],
  [GalleryController, ['insertManyGallery', 'getAllGalleriesByAdmin']],
  [ManuscriptController, ['getAllManuscripts', 'updateManuscriptById', 'deleteManuscriptById']],
  [NotificationController, ['updateNotificationById']],
  [CouponController, ['getAllCoupons']],
  [MultiPromoOfferController, ['addMultiPromoOffer', 'deleteMultiPromoOfferById']],
  [PromoOfferController, ['addPromoOffer', 'deletePromoOfferById']],
  [SpecialPackageController, ['addSpecialPackage', 'deleteSpecialPackageById']],
  [PraptisthanaController, ['addPraptisthana', 'updatePraptisthanaById', 'deletePraptisthanaById']],
  [PreOrderController, ['getAllPreOrders', 'updatePreOrderStatus', 'deletePreOrderById']],
  [ProductController, ['setProductQtyNotNull', 'setProductImageHttpToHttps']],
  [ProfileController, ['addProfile', 'updateProfileById', 'deleteProfileById']],
  [ReviewController, ['addReviewByAdmin']],
  [
    OrderController,
    [
      'updateDate',
      'generateInvoices',
      'getAllIncompleteOrders',
      'updateIncompleteOrderById',
      'deleteMultipleIncompleteOrderById',
      'getAllOrders',
      'updateOrderById',
      'updateMultipleOrderById',
      'updateOrderSessionKey',
      'changeOrderStatus',
      'sendToCourier',
      'deleteOrderById',
      'checkFraudSpy',
      'getRepeatCustomers',
    ],
  ],
  [
    UploadController,
    [
      'uploadSingleImage',
      'uploadSingleImageV2',
      'uploadMultipleImages',
      'uploadMultipleImagesV2',
      'deleteSingleFile',
      'deleteMultipleFile',
      'uploadMultipleFiles',
      'deleteMultipleFilePdf',
      'updateCsv',
    ],
  ],
  [UserController, ['resetUserPassword']],
  [YoutubeVideoController, ['addYoutubeVideo', 'updateYoutubeVideoById', 'deleteYoutubeVideoById']],
];

/** Storefront / checkout / payment / submission routes that must stay public. */
// eslint-disable-next-line @typescript-eslint/ban-types
const PUBLIC: Array<[Function, string[]]> = [
  [AdminController, ['adminLogin']],
  [ContactController, ['addContact']],
  [NewsletterController, ['addNewsletter']],
  [ManuscriptController, ['addManuscript']],
  [PreOrderController, ['addPreOrder']],
  [OrderController, ['addOrderByAnonymous', 'addIncompleteOrder']],
  [ProductController, ['getAllProducts', 'getProductByIds']],
  [CouponController, ['checkCouponAnonymousAvailability']],
  [UserController, ['userLogin', 'userSignup']],
];

// eslint-disable-next-line @typescript-eslint/ban-types
function guardsOf(controller: Function, method: string): unknown[] {
  const handler = controller.prototype[method];
  if (typeof handler !== 'function') {
    throw new Error(`${controller.name}.${method} not found — was it renamed?`);
  }
  return Reflect.getMetadata(GUARDS_METADATA, handler) || [];
}

describe('admin route lockdown', () => {
  const adminCases = ADMIN_ONLY.flatMap(([c, methods]) => methods.map((m) => [`${c.name}.${m}`, c, m] as const));
  const publicCases = PUBLIC.flatMap(([c, methods]) => methods.map((m) => [`${c.name}.${m}`, c, m] as const));

  it('covers every locked handler', () => {
    expect(adminCases.length).toBe(80);
  });

  it.each(adminCases)('%s requires the admin JWT', (_name, controller, method) => {
    expect(guardsOf(controller, method)).toContain(AdminJwtAuthGuard);
  });

  it.each(publicCases)('%s stays public (no admin guard)', (_name, controller, method) => {
    expect(guardsOf(controller, method)).not.toContain(AdminJwtAuthGuard);
  });

  it('admin signup is restricted to super admins with create permission', () => {
    const handler = AdminController.prototype.adminSignup;
    const guards = guardsOf(AdminController, 'adminSignup');
    expect(guards).toEqual(expect.arrayContaining([AdminJwtAuthGuard, AdminRolesGuard, AdminPermissionGuard]));
    expect(Reflect.getMetadata(ADMIN_ROLES_KEY, handler)).toEqual([AdminRoles.SUPER_ADMIN]);
    expect(Reflect.getMetadata(ADMIN_PERMISSIONS_KEY, handler)).toEqual([AdminPermissions.CREATE]);
  });

  it('AdminJwtAuthGuard rejects requests without a valid admin token', () => {
    const guard = new AdminJwtAuthGuard();
    expect(() => guard.handleRequest(null, false, undefined)).toThrow(UnauthorizedException);
    expect(guard.handleRequest(null, { _id: 'a1', role: 'admin' }, undefined)).toEqual({ _id: 'a1', role: 'admin' });
  });
});
