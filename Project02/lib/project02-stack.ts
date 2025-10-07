import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import {
  BucketDeployment,
  Source,
  CacheControl,
} from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

export class Project02Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const staticSiteBucket = new Bucket(this, "StaticSiteBucket", {
      websiteIndexDocument: "index.html",
      publicReadAccess: false, // explicit policy below
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY, // allow public ACLs/policies
      versioned: true,

      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Public-read bucket policy
    staticSiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "PublicReadGetObject",
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ["s3:GetObject"],
        resources: [staticSiteBucket.arnForObjects("*")],
      })
    );

    // Upload local files (from ./site) to the bucket
    new BucketDeployment(this, "DeployStaticSite", {
      destinationBucket: staticSiteBucket,
      sources: [Source.asset("./site")],
      cacheControl: [CacheControl.noCache()],
      prune: true,
    });

    new cdk.CfnOutput(this, "WebsiteURL", {
      value: staticSiteBucket.bucketWebsiteUrl,
    });
    new cdk.CfnOutput(this, "BucketName", {
      value: staticSiteBucket.bucketName,
    });
  }
}
