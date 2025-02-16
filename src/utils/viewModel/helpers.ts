import pluralize from 'pluralize';
import { Repo } from 'src/repos/repo';
import { UploadsFilter } from 'src/uploads/uploads.service';
import { FilterDescriptionViewModel } from '../view/filterDescription';
import { FilterFormViewModel } from '../view/filterForm';
import { URLHelpers } from '../urlHelpers';
import { InputViewModel } from '../view/input';
import { Upload } from 'src/uploads/upload.entity';

export class ViewModelHelpers {
  static formatPercentage(amount: number, total: number): string | null {
    if (total == 0) {
      return null;
    }

    return `${((100 * amount) / total).toFixed(1)}%`;
  }

  static formatPercentageAsCountSuffix(amount: number, total: number): string {
    const formattedPercentage = this.formatPercentage(amount, total);

    if (formattedPercentage === null) {
      return '';
    }

    return ` (${formattedPercentage})`;
  }

  static viewModelForFilter(
    repo: Repo,
    filter: UploadsFilter,
    options: {
      displayOverviewLink: boolean;
      filterHref: string | null;
      fullSentenceSummary: boolean;
    },
  ): FilterDescriptionViewModel {
    return {
      summary: this.summaryForFilter(repo, filter, options),
      overviewLink: options.displayOverviewLink
        ? {
            text: 'overview',
            href: URLHelpers.hrefForUploads(repo, filter),
          }
        : null,
      filterLink:
        options.filterHref !== null
          ? {
              text: 'Filter results',
              href: options.filterHref,
            }
          : null,
    };
  }

  private static summaryForFilter(
    repo: Repo,
    filter: UploadsFilter,
    options: { fullSentenceSummary: boolean },
  ) {
    const uploadsComponents: string[] = [];
    const failuresComponents: string[] = [];

    uploadsComponents.push(
      `belonging to the ${this.descriptionForRepo(repo)} repo`,
    );

    if (filter.branches.length > 0) {
      uploadsComponents.push(
        `from ${pluralize(
          'branch',
          filter.branches.length,
        )} ${filter.branches.join(', ')}`,
      );
    }

    if (filter.createdBefore !== null) {
      uploadsComponents.push(
        `which were uploaded before ${filter.createdBefore.toISOString()}`,
      );
    }

    if (filter.createdAfter !== null) {
      uploadsComponents.push(
        `which were uploaded after ${filter.createdAfter.toISOString()}`,
      );
    }

    if (filter.failureMessage !== null) {
      failuresComponents.push(
        `whose message contains (case-insensitive) "${filter.failureMessage}"`,
      );
    }

    if (filter.onlyFailuresWithCrashReports) {
      failuresComponents.push('that have a crash report attached');
    }

    if (uploadsComponents.length == 0 && failuresComponents.length == 0) {
      return '';
    }

    const uploadsDescription =
      uploadsComponents.length > 0
        ? `uploads ${uploadsComponents.join(' and ')}`
        : null;
    const failuresDescription =
      failuresComponents.length > 0
        ? `test failures ${failuresComponents.join(' and ')}`
        : null;

    return `${
      options.fullSentenceSummary ? 'You are currently only viewing ' : ''
    }${[uploadsDescription, failuresDescription]
      .filter((val) => val !== null)
      .join(', and ')}${options.fullSentenceSummary ? '.' : ''}`;
  }

  static formViewModelForFilter(
    filter: UploadsFilter | null,
    availableBranches: string[],
    paramNamePrefix: string,
    options: Pick<FilterFormViewModel, 'formAction' | 'submitButton'>,
  ): FilterFormViewModel {
    return {
      hiddenFields: [],
      ...options,
      branchOptions: {
        idPrefix: 'branches',
        name: `${paramNamePrefix}branches[]`,
        checkboxes: availableBranches.map((branch) => ({
          label: branch,
          value: branch,
          checked: filter?.branches.includes(branch) ?? false,
        })),
      },

      createdBefore: {
        name: `${paramNamePrefix}createdBefore`,
        value: filter?.createdBefore?.toISOString() ?? '',
      },

      createdAfter: {
        name: `${paramNamePrefix}createdAfter`,
        value: filter?.createdAfter?.toISOString() ?? '',
      },

      failureMessage: {
        name: `${paramNamePrefix}failureMessage`,
        value: filter?.failureMessage ?? '',
      },

      onlyFailuresWithCrashReports: {
        idPrefix: 'onlyFailuresWithCrashReports',
        name: 'onlyFailuresWithCrashReports',
        checkboxes: [
          {
            label: 'Only show test failures that have a crash report attached',
            value: 'true',
            checked: filter?.onlyFailuresWithCrashReports ?? false,
          },
        ],
      },
    };
  }

  static hiddenFieldsForFilter(
    filter: UploadsFilter,
    paramNamePrefix: string,
  ): InputViewModel[] {
    return URLHelpers.queryComponentsForFilter(filter, {
      paramPrefix: paramNamePrefix,
    }).map((component) => ({ name: component.key, value: component.value }));
  }

  static branchNameForUpload(
    upload: Pick<Upload, 'githubHeadRef' | 'githubRefName'>,
  ) {
    return upload.githubHeadRef ?? upload.githubRefName ?? '';
  }

  static descriptionForRepo(repo: Repo) {
    return `${repo.owner}/${repo.name}`;
  }
}
